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

class LearnerQuestionSerializer(serializers.ModelSerializer):
    options = LearnerOptionSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'prompt', 'question_type', 'points', 'order', 'options']

class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = ['id', 'lesson', 'title', 'description', 'passing_score', 'time_limit_minutes', 'max_attempts', 'is_published', 'questions']

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

    class Meta:
        model = QuizAttempt
        fields = ['id', 'quiz', 'attempt_number', 'status', 'score', 'passed', 'started_at', 'submitted_at', 'answers']