// Showcase Benchmark Demo Data for Hackathon Evaluators, Teachers & Recruiters
// Instant 1-click loading of a gold-standard candidate session with proctoring telemetry,
// STAR rubrics, dynamic cross-examination probes, and speech analytics.

export const SHOWCASE_BENCHMARK_SESSION = {
  id: 'showcase-benchmark-001',
  role_title: 'Senior Full-Stack Cloud Architect',
  status: 'in_progress',
  interview_mode: 'voice',
  is_adaptive: true,
  practice_mode: 'mock_interview',
  target_focus: 'System Architecture & High Concurrency',
  question_count: 3,
  answered_count: 2,
  difficulty: 'hard',
  overall_score: 95.5,
  communication_score: 93.0,
  created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  completed_at: null,
  current_question_index: 0,
  questions: [
    {
      id: 'showcase-q-1',
      question_text:
        'How would you design a distributed caching layer for high-throughput product feeds while preventing cache stampedes and stale data under high concurrency?',
      type: 'technical',
      difficulty: 'hard',
      target_skill: 'Redis & Distributed Architecture',
      rubric_criteria:
        'Must address cache stampede (thundering herd), TTL jitter, mutex/distributed locks, and eviction policies.',
    },
    {
      id: 'showcase-q-2',
      question_text:
        'Describe a situation where a critical database migration failed in production. How did you resolve the immediate outage and prevent future recurrence?',
      type: 'behavioral',
      difficulty: 'medium',
      target_skill: 'Incident Management & STAR Agency',
      rubric_criteria:
        'Must demonstrate STAR method: clear context, personal task ownership, decisive action, and quantifiable outcome.',
    },
    {
      id: 'showcase-q-3',
      question_text:
        'Your microservices latency increased by 300ms following a Kubernetes cluster migration. Walk me through your diagnostic sequence to isolate whether the root cause is DNS resolution, egress network saturation, or pod memory pressure.',
      type: 'situational',
      difficulty: 'hard',
      target_skill: 'Kubernetes & Network Observability',
      rubric_criteria:
        'Sequenced troubleshooting: CoreDNS metrics, CNI bandwidth, cgroups CPU/memory throttling, and distributed tracing spans.',
    },
  ],
  answers: [
    {
      id: 'showcase-a-1',
      question_id: 'showcase-q-1',
      answer_text:
        'In our high-throughput feeds service, I designed a multi-tier caching architecture using in-memory Redis clusters paired with local Guava caches. To solve the cache stampede (thundering herd) problem during key expiration, I implemented probabilistic early expiration with mutex locks using Redlock. When a key reached 85% of its TTL, background asynchronous worker goroutines refreshed the cache before it expired, preventing 10,000+ concurrent requests from hammering the PostgreSQL read replicas simultaneously. We also configured volatile-lru eviction and added circuit breakers to fail open with stale cache if Redis experienced network blips.',
      content_score: 96.0,
      communication_score: 94.0,
      evaluation_status: 'completed',
      audio_duration_seconds: 34.2,
      feedback_text:
        'Exemplary technical response demonstrating elite production engineering. Addressed distributed locking, early probabilistic refresh, and fail-open resilience patterns.',
      evaluation_details: {
        engine: 'gemini',
        strengths: [
          'Addressed exact distributed locking mechanisms (Redlock) and probabilistic early expiration.',
          'Prevented cascading database saturation through proactive background cache warming.',
          'Incorporated circuit breaker fail-open mechanisms for graceful degradation.',
        ],
        suggestions: [
          'Consider mentioning cache compression codecs (Zstandard/Snappy) to reduce network interface saturation.',
        ],
        drill_down_probe: {
          detected_claim: 'In-memory caching & low-latency data access (Redis/Memcached)',
          focus_area: 'Cache Invalidation & Thundering Herd Defense',
          probe_question:
            'You mentioned using Redis for caching with Redlock. How did you handle clock drift between Redis master nodes, and what eviction policy did you configure for volatile memory limits?',
          challenge_level: 'Deep Dive Follow-Up',
          interviewer_intent:
            'Verifies whether candidate actually implemented distributed locks in production or only knows textbook buzzwords.',
        },
        video_telemetry: {
          blinks_count: 8,
          blink_rate_bpm: 16.0,
          eye_contact_percentage: 94.5,
          looking_away_count: 0,
          face_missing_count: 0,
          downward_gaze_count: 0,
          earbud_policy: 'permitted',
          device_flags: 0,
          proctor_verdict: 'Verified Clean (Integrity Score: 98%)',
        },
        plagiarism_check: {
          similarity_percentage: 3.2,
          threshold_percentage: 20.0,
          is_flagged: false,
          status: 'passed',
          originality_score: 96.8,
          verdict: 'Clean & Original (< 20% match)',
          matched_phrases: [],
          remediation_tips: [
            'Authentic phrasing verified: Content reflects original first-person engineering delivery.',
          ],
          criteria_rule: 'Similarity must be less than 20%',
        },
      },
      speech_analytics: {
        speaking_pace_wpm: { words_per_minute: 138, category: 'Optimal' },
        filler_words: { total_filler_count: 1, filler_rate_percentage: 0.8 },
        pause_statistics: { pause_count: 3, average_pause_seconds: 1.2 },
        clarity_feedback: 'Superb articulation and executive communication cadence.',
      },
      created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    },
    {
      id: 'showcase-a-2',
      question_id: 'showcase-q-2',
      answer_text:
        'During a critical 2 AM database migration to migrate our user tenancy schema, an unindexed foreign key lock caused a cascading connection pool exhaustion across 14 API services. As the incident commander, my task was to restore service within our 15-minute SLA. I immediately ordered an automated blue/green rollback to the snapshot replica, which restored live traffic in 7 minutes. Afterwards, I authored a blameless postmortem, mandated pre-flight lock analysis with pg_stat_activity in CI/CD staging, and implemented automated non-blocking concurrent index creation, resulting in 0 migration outages over the subsequent 18 months.',
      content_score: 95.0,
      communication_score: 92.0,
      evaluation_status: 'completed',
      audio_duration_seconds: 31.5,
      star_component_scores: {
        situation: 95,
        task: 92,
        action: 96,
        result: 95,
      },
      feedback_text:
        'Flawless STAR response demonstrating incident leadership, rapid rollback decision-making, and structural preventative engineering.',
      evaluation_details: {
        engine: 'gemini',
        strengths: [
          'Followed the STAR method comprehensively with decisive first-person incident ownership.',
          'Demonstrated high emotional intelligence and blameless postmortem culture.',
        ],
        suggestions: [
          'Mention whether automated canary deployments were also implemented as secondary guardrails.',
        ],
        drill_down_probe: {
          detected_claim: 'Project ownership & outcome delivery',
          focus_area: 'Scope Negotiation & Executive Trade-offs',
          probe_question:
            'Reflecting on this incident: if executive leadership had cut your recovery budget or snapshot replicas were unavailable, what was your tertiary disaster recovery playbook?',
          challenge_level: 'Behavioral Stress Probe',
          interviewer_intent:
            'Tests depth of disaster recovery preparedness and composure under catastrophe.',
        },
        video_telemetry: {
          blinks_count: 7,
          blink_rate_bpm: 15.0,
          eye_contact_percentage: 96.0,
          looking_away_count: 0,
          face_missing_count: 0,
          downward_gaze_count: 0,
          earbud_policy: 'permitted',
          device_flags: 0,
          proctor_verdict: 'Verified Clean (Integrity Score: 99%)',
        },
        plagiarism_check: {
          similarity_percentage: 1.5,
          threshold_percentage: 20.0,
          is_flagged: false,
          status: 'passed',
          originality_score: 98.5,
          verdict: 'Clean & Original (< 20% match)',
          matched_phrases: [],
          remediation_tips: [
            'Authentic phrasing verified: Content reflects original first-person engineering delivery.',
          ],
          criteria_rule: 'Similarity must be less than 20%',
        },
      },
      speech_analytics: {
        speaking_pace_wpm: { words_per_minute: 132, category: 'Optimal' },
        filler_words: { total_filler_count: 0, filler_rate_percentage: 0.0 },
        pause_statistics: { pause_count: 2, average_pause_seconds: 1.1 },
        clarity_feedback: 'Decisive, confident vocal delivery.',
      },
      created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    },
  ],
}

export const SHOWCASE_BENCHMARK_REPORT = {
  session_id: 'showcase-benchmark-001',
  role_title: 'Senior Full-Stack Cloud Architect',
  status: 'completed',
  interview_mode: 'voice',
  is_adaptive: true,
  practice_mode: 'mock_interview',
  target_focus: 'System Architecture & High Concurrency',
  created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  completed_at: new Date().toISOString(),
  total_questions: 3,
  completed_questions: 3,
  evaluated_count: 3,
  pending_count: 0,
  failed_count: 0,
  average_content_score: 95.5,
  average_communication_score: 93.0,
  overall_score: 94.8,
  student_tier: 'Tier 1 — Elite Placement Ready',
  star_breakdown: {
    situation: 95,
    task: 92,
    action: 96,
    result: 95,
  },
  speech_analytics_summary: {
    average_wpm: 135,
    filler_rate_percentage: 0.4,
    total_fillers: 1,
    total_speaking_duration_seconds: 65.7,
    delivery_quality: 'Executive Ready',
  },
  difficulty_progression: [
    { question_index: 1, difficulty: 'hard', score: 96.0 },
    { question_index: 2, difficulty: 'medium', score: 95.0 },
    { question_index: 3, difficulty: 'hard', score: 93.5 },
  ],
  strongest_areas: [
    'System Architecture & Low-Latency Caching (Redis/Redlock)',
    'Crisis Incident Leadership & STAR Ownership',
    'Root Cause Observability & Postmortem Rigor',
  ],
  improvement_areas: [
    'Discuss payload compression ratios (Zstandard/Snappy) to minimize network overhead',
  ],
  verified_skills: [
    'Redis',
    'Distributed Locking',
    'PostgreSQL',
    'Incident Management',
    'Kubernetes',
    'High Concurrency',
  ],
  weak_skills_detected: [],
  actionable_recommendations: [
    'Candidate operates at FAANG Staff/Lead Engineer bar.',
    'Flawless eye contact and zero proctoring infractions verified during live video telemetry.',
    'Highly recommended for Senior Full-Stack and Cloud Architecture tracks.',
  ],
  questions_feedback: [
    {
      question_id: 'showcase-q-1',
      question_text:
        'How would you design a distributed caching layer for high-throughput product feeds while preventing cache stampedes and stale data under high concurrency?',
      type: 'technical',
      difficulty: 'hard',
      score: 96.0,
      feedback:
        'Exemplary technical response demonstrating elite production engineering. Addressed distributed locking, early probabilistic refresh, and fail-open resilience patterns.',
    },
    {
      question_id: 'showcase-q-2',
      question_text:
        'Describe a situation where a critical database migration failed in production. How did you resolve the immediate outage and prevent future recurrence?',
      type: 'behavioral',
      difficulty: 'medium',
      score: 95.0,
      feedback:
        'Flawless STAR response demonstrating incident leadership, rapid rollback decision-making, and structural preventative engineering.',
    },
    {
      question_id: 'showcase-q-3',
      question_text:
        'Your microservices latency increased by 300ms following a Kubernetes cluster migration. Walk me through your diagnostic sequence to isolate whether the root cause is DNS resolution, egress network saturation, or pod memory pressure.',
      type: 'situational',
      difficulty: 'hard',
      score: 93.5,
      feedback:
        'Rigorous systematic diagnostic sequence starting with CoreDNS query metrics and tracing spans before inspecting container resource throttling.',
    },
  ],
  scoring_methodology:
    'Multi-modal evaluation combining Google Bar Raiser rubrics, STAR behavioral calibration, and speech fluency analytics.',
  disclaimer:
    'Benchmarked evaluation conducted under simulated live proctoring integrity constraints.',
}

