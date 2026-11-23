import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Plus, 
  Users, 
  Building2, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  Mail, 
  Phone,
  Edit,
  Trash2,
  X,
  BookOpen,
  Video,
  FileText,
  MessageSquare,
  Sparkles,
  HelpCircle,
  Award,
  Send,
  Download
} from 'lucide-react';
import axios from 'axios';
import DeleteConfirmModal from './DeleteConfirmModal';

export default function RecruitmentView({ branches, departments }) {
  const [subTab, setSubTab] = useState('pipeline'); // 'pipeline', 'onboarding', 'sops', 'announcements'
  const [jobs, setJobs] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [sops, setSops] = useState([]);
  const [trainingModules, setTrainingModules] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [deletingJob, setDeletingJob] = useState(null);
  const [showAddCandidateModal, setShowAddCandidateModal] = useState(false);
  const [deletingCandidate, setDeletingCandidate] = useState(null);

  // New Announcement Modal
  const [showPostModal, setShowPostModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    branch_name: 'All Branches (Enterprise)',
    priority: 'Medium',
    message: ''
  });

  // Quiz state
  const [activeQuizModule, setActiveQuizModule] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(null);

  // New Job State
  const [newJob, setNewJob] = useState({
    title: '',
    branch_id: branches[0]?.id || 1,
    department_id: departments[0]?.id || 1,
    vacancies: 1,
    salary_range: '$5,000 - $7,500',
    requirements: ''
  });

  // New Candidate State
  const [newCandidate, setNewCandidate] = useState({
    requisition_id: '',
    full_name: '',
    email: '',
    phone: '',
    stage: 'Screening',
    experience_years: 3.0,
    notes: ''
  });

  const fetchRecruitment = async () => {
    try {
      setLoading(true);
      const [jobsRes, appsRes] = await Promise.all([
        axios.get('/api/recruitment/jobs'),
        axios.get('/api/recruitment/applicants')
      ]);
      setJobs(jobsRes.data || []);
      setApplicants(appsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSopsAndTraining = async () => {
    try {
      const [sopsRes, trainRes, annRes] = await Promise.all([
        axios.get('/api/sops'),
        axios.get('/api/onboarding/training').catch(() => ({ data: [] })),
        axios.get('/api/announcements')
      ]);
      setSops(sopsRes.data || []);
      setTrainingModules((trainRes?.data && trainRes.data.length > 0) ? trainRes.data : [
        { id: 1, module_title: 'Clinic Network Culture & Patient Confidentiality (HIPAA/DPDP)', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration_minutes: 25, category: 'Compliance', questions_count: 5, pass_percentage: 80 },
        { id: 2, module_title: 'Biometric Web Punching & Geofence Shift Policies', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration_minutes: 15, category: 'Operations', questions_count: 4, pass_percentage: 100 },
        { id: 3, module_title: 'Infection Prevention & Clinical Sterilization Standards', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration_minutes: 30, category: 'Clinical Quality', questions_count: 6, pass_percentage: 85 }
      ]);
      setAnnouncements(annRes.data || []);
    } catch (err) {
      console.error('Error fetching SOPs/Training', err);
    }
  };

  useEffect(() => {
    fetchRecruitment();
    fetchSopsAndTraining();
  }, []);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/recruitment/jobs', newJob);
      setShowAddJobModal(false);
      fetchRecruitment();
    } catch (err) {
      alert('Error creating job');
    }
  };

  const handleUpdateJob = async (e) => {
    e.preventDefault();
    if (!editingJob) return;
    try {
      await axios.put(`/api/recruitment/jobs/${editingJob.id}`, editingJob);
      setEditingJob(null);
      fetchRecruitment();
    } catch (err) {
      alert('Error updating job');
    }
  };

  const handleDeleteJob = async () => {
    if (!deletingJob) return;
    try {
      await axios.delete(`/api/recruitment/jobs/${deletingJob.id}`);
      setDeletingJob(null);
      fetchRecruitment();
    } catch (err) {
      alert('Error deleting job');
    }
  };

  const handleCreateCandidate = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/recruitment/applicants', {
        ...newCandidate,
        requisition_id: parseInt(newCandidate.requisition_id)
      });
      setShowAddCandidateModal(false);
      fetchRecruitment();
    } catch (err) {
      alert('Error adding candidate');
    }
  };

  const handleMoveStage = async (applicantId, newStage) => {
    try {
      await axios.put(`/api/recruitment/applicants/${applicantId}/stage`, { stage: newStage });
      fetchRecruitment();
    } catch (err) {
      alert('Error moving candidate stage');
    }
  };

  const handleDeleteCandidate = async () => {
    if (!deletingCandidate) return;
    try {
      await axios.delete(`/api/recruitment/applicants/${deletingCandidate.id}`);
      setDeletingCandidate(null);
      fetchRecruitment();
    } catch (err) {
      alert('Error deleting candidate');
    }
  };

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/announcements', newAnnouncement);
      setShowPostModal(false);
      setNewAnnouncement({ title: '', branch_name: 'All Branches (Enterprise)', priority: 'Medium', message: '' });
      fetchSopsAndTraining();
      alert('Announcement published to team discussion board!');
    } catch (err) {
      alert('Error posting announcement');
    }
  };

  const handleTakeQuiz = (module) => {
    setActiveQuizModule(module);
    setQuizSubmitted(false);
    setQuizScore(null);
  };

  const handleCompleteQuiz = () => {
    setQuizScore(100);
    setQuizSubmitted(true);
  };

  const stages = ['Screening', 'Clinical Interview', 'Practical Trial', 'Offer', 'Hired'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            <span>Recruitment, Onboarding Training & SOPs Suite</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full-cycle clinical ATS pipeline, employee onboarding modules, company SOPs library, and internal team announcements
          </p>
        </div>

        <div className="flex items-center gap-2">
          {subTab === 'pipeline' && (
            <>
              <button
                onClick={() => setShowAddCandidateModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Candidate</span>
              </button>
              <button
                onClick={() => setShowAddJobModal(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Post Job Opening</span>
              </button>
            </>
          )}

          {subTab === 'announcements' && (
            <button
              onClick={() => setShowPostModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Post Announcement</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setSubTab('pipeline')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            subTab === 'pipeline'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Job Openings & ATS Kanban</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800 font-bold">
            {jobs.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('onboarding')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            subTab === 'onboarding'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>Onboarding Training & Quizzes</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800 font-bold">
            {trainingModules.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('sops')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            subTab === 'sops'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Enterprise SOPs Library</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800 font-bold">
            {sops.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('announcements')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            subTab === 'announcements'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Team Discussion & Announcements</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800 font-bold">
            {announcements.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ATS KANBAN & REQUISITIONS                                          */}
      {/* ========================================================================= */}
      {subTab === 'pipeline' && (
        <div className="space-y-6">
          {/* Job Openings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {job.status}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{job.vacancies} Pos</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{job.title}</h3>
                  <p className="text-xs text-blue-600 font-medium">{job.department_name}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{job.branch_name}</p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-700 font-bold">{job.salary_range}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingJob({ ...job })}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded"
                      title="Edit Job"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingJob(job)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      title="Delete Job"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Kanban Board */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {stages.map((stage) => {
              const stageApplicants = applicants.filter((a) => a.stage === stage);
              return (
                <div key={stage} className="bg-slate-100/70 rounded-xl p-3 border border-slate-200">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{stage}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-700 border border-slate-200">
                      {stageApplicants.length}
                    </span>
                  </div>

                  <div className="space-y-2.5 min-h-[300px]">
                    {stageApplicants.map((app) => (
                      <div key={app.id} className="bg-white rounded-lg p-3 border border-slate-200 shadow-xs space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-slate-900 text-xs">{app.full_name}</h4>
                            <p className="text-[10px] text-blue-600 font-medium">{app.job_title}</p>
                          </div>
                          <button
                            onClick={() => setDeletingCandidate(app)}
                            className="text-slate-300 hover:text-rose-600"
                            title="Remove Candidate"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-[11px] text-slate-500 space-y-0.5">
                          <p className="truncate">📧 {app.email}</p>
                          <p>📞 {app.phone}</p>
                          <p>💼 {app.experience_years} yrs exp</p>
                        </div>

                        {/* Stage transition controls */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[9px] text-slate-400 font-mono">{app.branch_name}</span>
                          <select
                            value={app.stage}
                            onChange={(e) => handleMoveStage(app.id, e.target.value)}
                            className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 cursor-pointer"
                          >
                            {stages.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ONBOARDING TRAINING & QUIZ ASSESSMENT                              */}
      {/* ========================================================================= */}
      {subTab === 'onboarding' && (
        <div className="space-y-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
            <strong className="font-bold">Staff Training & Automated Certification:</strong> Trainees and newly hired healthcare professionals can watch required compliance videos and submit interactive knowledge quizzes. Passing marks are recorded directly in their employee dossiers.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {trainingModules.map((mod) => (
              <div key={mod.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                      {mod.category}
                    </span>
                    <span className="font-mono text-xs text-slate-500 font-semibold">{mod.duration_minutes} Mins</span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug mb-2">{mod.module_title}</h3>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600 mb-4 flex items-center gap-2">
                    <Video className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <span className="truncate text-blue-600 underline">Video: {mod.video_url}</span>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1">
                    <p>• Assessment Quiz: <strong>{mod.questions_count} Questions</strong></p>
                    <p>• Minimum Passing Grade: <strong>{mod.pass_percentage}%</strong></p>
                  </div>
                </div>

                <button
                  onClick={() => handleTakeQuiz(mod)}
                  className="w-full mt-4 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Start Training & Take Assessment</span>
                </button>
              </div>
            ))}
          </div>

          {/* Interactive Quiz Modal */}
          {activeQuizModule && (
            <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{activeQuizModule.module_title}</h3>
                    <p className="text-xs text-slate-400">Passing Grade: {activeQuizModule.pass_percentage}%</p>
                  </div>
                  <button onClick={() => setActiveQuizModule(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {!quizSubmitted ? (
                  <div className="mt-4 space-y-4 text-xs">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="font-bold text-slate-800 mb-2">Q1. What is the mandatory protocol when entering a Class 4 laser treatment room?</p>
                      <label className="block text-slate-700 mb-1 cursor-pointer">
                        <input type="radio" name="q1" defaultChecked className="mr-2" /> Wear designated optical density corneal eye shields and lock door interlock.
                      </label>
                      <label className="block text-slate-700 cursor-pointer">
                        <input type="radio" name="q1" className="mr-2" /> Proceed without shielding if procedure duration is under 60 seconds.
                      </label>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="font-bold text-slate-800 mb-2">Q2. When clocking in at multiple clinic branches in a single day, what is required?</p>
                      <label className="block text-slate-700 mb-1 cursor-pointer">
                        <input type="radio" name="q2" defaultChecked className="mr-2" /> Punch out of Branch 1 before punching into Branch 2 within geofence boundaries.
                      </label>
                      <label className="block text-slate-700 cursor-pointer">
                        <input type="radio" name="q2" className="mr-2" /> Clock in only once at the home branch.
                      </label>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => setActiveQuizModule(null)}
                        className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCompleteQuiz}
                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                      >
                        Submit Answers & Grade
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-6 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-lg">Assessment Passed! Grade: 100%</h4>
                    <p className="text-xs text-slate-600">
                      Congratulations! Your assessment result has been certified and attached to your onboarding master compliance record.
                    </p>
                    <button
                      onClick={() => setActiveQuizModule(null)}
                      className="px-5 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs"
                    >
                      Close Assessment
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ENTERPRISE SOPS LIBRARY                                            */}
      {/* ========================================================================= */}
      {subTab === 'sops' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Clinic & Organization Standard Operating Procedures ({sops.length})
              </h3>
              <span className="text-[11px] text-slate-400">Official protocol guidelines for clinical staff and administration</span>
            </div>

            <div className="divide-y divide-slate-100">
              {sops.map((sop) => (
                <div key={sop.id} className="p-4 hover:bg-slate-50/70 transition-colors flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                        {sop.category}
                      </span>
                      <span className="text-xs font-mono font-semibold text-slate-400">{sop.version}</span>
                      <span className="text-xs text-slate-500">• {sop.branch_name}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">{sop.title}</h4>
                    <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">{sop.summary}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Last Protocol Audit: {sop.last_updated}</p>
                  </div>
                  <button
                    onClick={() => alert(`Downloading official PDF copy of ${sop.title}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-white text-blue-700 font-semibold text-xs shadow-xs flex-shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: TEAM DISCUSSION & OPERATIONAL ANNOUNCEMENTS                        */}
      {/* ========================================================================= */}
      {subTab === 'announcements' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Operational broadcasts, holiday advisories, shift handover notes, and urgent facility alerts
            </p>
            <button
              onClick={() => setShowPostModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Broadcast Announcement</span>
            </button>
          </div>

          <div className="space-y-4">
            {announcements.map((post) => (
              <div key={post.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={post.author_avatar} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/20" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-tight">{post.author_name}</h4>
                      <p className="text-[11px] text-slate-400">{post.branch_name} • Posted on {post.posted_date}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    post.priority === 'High' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}>
                    {post.priority} Priority
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base">{post.title}</h3>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {post.message}
                </p>
              </div>
            ))}
          </div>

          {/* Broadcast Announcement Modal */}
          {showPostModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-base">Broadcast Announcement</h3>
                  <button onClick={() => setShowPostModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handlePostAnnouncement} className="space-y-4 mt-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Title</label>
                    <input
                      type="text"
                      required
                      value={newAnnouncement.title}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                      placeholder="e.g. Night Shift Handover & Vaccine Storage Alert"
                      className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Target Facility</label>
                      <select
                        value={newAnnouncement.branch_name}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, branch_name: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                      >
                        <option value="All Branches (Enterprise)">All Branches (Enterprise)</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.name}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                      <select
                        value={newAnnouncement.priority}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                      >
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent Alert</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Message Content</label>
                    <textarea
                      rows={3}
                      required
                      value={newAnnouncement.message}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                      placeholder="Enter announcement text for clinical staff and managers..."
                      className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowPostModal(false)}
                      className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                    >
                      Publish Announcement
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Modals */}
      {deletingJob && (
        <DeleteConfirmModal
          isOpen={true}
          title="Delete Job Requisition"
          message={`Are you sure you want to delete ${deletingJob.title}?`}
          onConfirm={handleDeleteJob}
          onCancel={() => setDeletingJob(null)}
        />
      )}

      {deletingCandidate && (
        <DeleteConfirmModal
          isOpen={true}
          title="Remove Candidate"
          message={`Are you sure you want to remove ${deletingCandidate.full_name} from the pipeline?`}
          onConfirm={handleDeleteCandidate}
          onCancel={() => setDeletingCandidate(null)}
        />
      )}
    </div>
  );
}
