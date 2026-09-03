import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import courseService from '../services/courseService';
import categoryService from '../services/categoryService';
import CourseCard from '../components/courses/CourseCard';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import {
  GraduationCap,
  Sparkles,
  ArrowRight,
  Compass,
  Code2,
  Cpu,
  Layers,
  Award,
  CheckCircle,
  Users,
  ShieldCheck,
  Star,
  BookOpen,
} from 'lucide-react';

export const Home = () => {
  const { isAuthenticated, isLearner, isInstructor } = useAuth();
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [coursesData, catData] = await Promise.all([
          courseService.getCourses(),
          categoryService.getCategories(),
        ]);
        const courseList = Array.isArray(coursesData) ? coursesData : coursesData.results || [];
        setFeaturedCourses(courseList.slice(0, 3));

        const catList = Array.isArray(catData) ? catData : catData.results || [];
        setCategories(catList.slice(0, 6));
      } catch (err) {
        console.warn('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  return (
    <div className="space-y-24 pb-20">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 lg:pt-20">
        {/* Glow ambient background orbs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold tracking-wide">
            <Sparkles className="w-4 h-4" />
            Empowering the Next Generation of Tech Leaders
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight max-w-4xl mx-auto leading-[1.1]">
            Learn In-Demand Tech Skills With <span className="gradient-text">Real Classrooms</span>
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Hands-on learning programs built for modern software engineers, cloud architects, and data practitioners.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {!isAuthenticated ? (
              <>
                <Link to="/register">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto text-base px-8 py-4 shadow-glow" rightIcon={<ArrowRight className="w-5 h-5" />}>
                    Explore All Programs
                  </Button>
                </Link>
                <Link to="/courses">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto text-base px-8 py-4">
                    Browse Free Starter Courses
                  </Button>
                </Link>
              </>
            ) : isInstructor ? (
              <Link to="/instructor/dashboard">
                <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  Enter Instructor Studio
                </Button>
              </Link>
            ) : (
              <Link to="/learner/dashboard">
                <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  Go to My Classroom
                </Button>
              </Link>
            )}
          </div>

          {/* Social Proof Stats */}
          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto border-t border-slate-800/80">
            <div className="space-y-1">
              <span className="text-2xl sm:text-3xl font-black text-white">100%</span>
              <p className="text-xs font-semibold text-slate-400">Project-Based Learning</p>
            </div>
            <div className="space-y-1">
              <span className="text-2xl sm:text-3xl font-black text-sky-400">24/7</span>
              <p className="text-xs font-semibold text-slate-400">Self-Paced Access</p>
            </div>
            <div className="space-y-1">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400">Expert</span>
              <p className="text-xs font-semibold text-slate-400">Instructor Reviews</p>
            </div>
            <div className="space-y-1">
              <span className="text-2xl sm:text-3xl font-black text-white">Verified</span>
              <p className="text-xs font-semibold text-slate-400">Progress Certificates</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED COURSES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-400">
              <Compass className="w-4 h-4" />
              Curated Curriculum
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Featured Programs & Courses
            </h2>
          </div>
          <Link to="/courses">
            <Button variant="ghost" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
              View All Courses
            </Button>
          </Link>
        </div>

        {loading ? (
          <Loader message="Loading featured courses..." />
        ) : featuredCourses.length === 0 ? (
          <div className="text-center py-12 glass-panel rounded-2xl border border-slate-800 text-sm text-slate-400">
            No published courses found. Instructors can publish courses via the Studio!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>

      {/* CATEGORIES SECTION */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Explore by Tech Domain
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Discover programs tailored for your specific career path.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/courses?category=${cat.id}`}
                className="glass-panel p-5 rounded-2xl border border-slate-800 text-center hover:border-sky-500/40 hover:shadow-glow-sm transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto text-sky-400 group-hover:scale-110 transition-transform mb-3">
                  <Code2 className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-200 group-hover:text-sky-400 transition-colors">
                  {cat.name}
                </h4>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* TWO PATHWAYS: LEARNER VS INSTRUCTOR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* For Learners */}
          <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-slate-800 space-y-6 relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">For Students & Learners</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Learn with video lessons, articles, code repos, and interactive quizzes. Submit project assignments and receive verified grading feedback.
              </p>
            </div>
            <Link to="/register">
              <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Start Learning Now
              </Button>
            </Link>
          </div>

          {/* For Instructors */}
          <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-slate-800 space-y-6 relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">For Industry Instructors</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Design custom curriculum modules with our Course Studio Builder. Upload lecture videos, resources, quizzes, and grade student submissions.
              </p>
            </div>
            <Link to="/register">
              <Button variant="secondary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Join as an Instructor
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
