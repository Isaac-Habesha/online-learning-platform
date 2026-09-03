from django.db import transaction
from rest_framework import serializers
from .models import Quiz, Question, Option, QuizAttempt, QuizAnswer

class OptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Option
        fields = ['id', 'text', 'order', 'is_correct']

class LearnerOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Option
        fields = ['id', 'text', 'order']

class QuestionSerializer(serializers.ModelSerializer):
    options = OptionSerializer(many=True)

    class Meta:
        model = Question
        fields = ['id', 'prompt', 'question_type', 'points', 'order', 'explanation', 'options']

    def create(self, validated_data):
        options_data = validated_data.pop('options', [])
        question = Question.objects.create(**validated_data)
        for opt in options_data:
            Option.objects.create(question=question, **opt)
        return question

    def update(self, instance, validated_data):
        options_data = validated_data.pop('options', None)
        
        # Update question fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update options if provided
        if options_data is not None:
            instance.options.all().delete()
            for opt in options_data:
                opt.pop('id', None)
                Option.objects.create(question=instance, **opt)
        
        return instance

class LearnerQuestionSerializer(serializers.ModelSerializer):
    options = LearnerOptionSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'prompt', 'question_type', 'points', 'order', 'options']

class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, required=False)

    class Meta:
        model = Quiz
        fields = ['id', 'lesson', 'title', 'description', 'passing_score', 'time_limit_minutes', 'max_attempts', 'is_published', 'questions']

    @transaction.atomic
    def create(self, validated_data):
        questions_data = validated_data.pop('questions', [])
        quiz = Quiz.objects.create(**validated_data)
        for idx, q_data in enumerate(questions_data, start=1):
            options_data = q_data.pop('options', [])
            if not q_data.get('order'):
                q_data['order'] = idx
            question = Question.objects.create(quiz=quiz, **q_data)
            options_to_create = []
            for opt_idx, option in enumerate(options_data, start=1):
                if not option.get('order'):
                    option['order'] = opt_idx
                options_to_create.append(Option(question=question, **option))
            Option.objects.bulk_create(options_to_create)
        return quiz

    @transaction.atomic
    def update(self, instance, validated_data):
        questions_data = validated_data.pop('questions', None)
        
        # Update quiz fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update questions if provided
        if questions_data is not None:
            instance.questions.all().delete()
            for idx, q_data in enumerate(questions_data, start=1):
                options_data = q_data.pop('options', [])
                if not q_data.get('order'):
                    q_data['order'] = idx
                question = Question.objects.create(quiz=instance, **q_data)
                options_to_create = []
                for opt_idx, option in enumerate(options_data, start=1):
                    if not option.get('order'):
                        option['order'] = opt_idx
                    options_to_create.append(Option(question=question, **option))
                Option.objects.bulk_create(options_to_create)
        
        return instance

class LearnerQuizSerializer(serializers.ModelSerializer):
    questions = LearnerQuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = ['id', 'title', 'description', 'passing_score', 'time_limit_minutes', 'max_attempts', 'questions']

class QuizAnswerSubmitSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    selected_option_id = serializers.IntegerField(required=False, allow_null=True)

class QuizSubmissionSerializer(serializers.Serializer):
    answers = QuizAnswerSubmitSerializer(many=True)

class QuizResultAnswerSerializer(serializers.ModelSerializer):
    question = QuestionSerializer(read_only=True)  # Include full question with options
    correct_option_id = serializers.SerializerMethodField()
    explanation = serializers.CharField(source='question.explanation', read_only=True)

    class Meta:
        model = QuizAnswer
        fields = ['question', 'selected_option', 'is_correct', 'correct_option_id', 'explanation']

    def get_correct_option_id(self, obj):
        correct_opt = obj.question.options.filter(is_correct=True).first()
        return correct_opt.id if correct_opt else None

class QuizAttemptResultSerializer(serializers.ModelSerializer):
    answers = QuizResultAnswerSerializer(many=True, read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)
    course_id = serializers.IntegerField(source='quiz.lesson.section.course.id', read_only=True)
    course_title = serializers.CharField(source='quiz.lesson.section.course.title', read_only=True)
    passing_score = serializers.IntegerField(source='quiz.passing_score', read_only=True)

    class Meta:
        model = QuizAttempt
        fields = [
            'id', 
            'quiz', 
            'quiz_title',
            'course_id',
            'course_title',
            'user_id',
            'user_email',
            'user_full_name',
            'attempt_number', 
            'status', 
            'score', 
            'passing_score',
            'passed', 
            'started_at', 
            'submitted_at', 
            'answers'
        ]