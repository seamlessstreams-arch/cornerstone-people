// Interview pack generator (rule-based, no AI required).
//
// Produces a structured, safeguarding- and values-based interview pack for a
// children's residential care role — the question areas the spec requires, plus
// scenario prompts. It is a template the panel uses; the panel records the
// scores and the decision (a human act), which the agent never makes.

export type InterviewArea = {
  area: string;
  intent: string;
  questions: string[];
};

export function interviewPack(opts?: { roleType?: string | null }): InterviewArea[] {
  const role = opts?.roleType?.trim() || "this role";

  return [
    {
      area: "Motivation & values",
      intent: "Why this work, and what they bring to a therapeutic home.",
      questions: [
        `What attracts you to ${role}, and to working with children in residential care?`,
        "Tell us about a time your values were tested at work. What did you do?",
        "What does a good day in a children's home look like to you?",
      ],
    },
    {
      area: "Safeguarding & child protection",
      intent: "Understanding of safeguarding duties and thresholds.",
      questions: [
        "What does safeguarding mean to you day to day in a children's home?",
        "A child tells you something that worries you. Walk us through exactly what you would do.",
        "What would make you escalate a concern, and who to?",
      ],
    },
    {
      area: "Professional boundaries",
      intent: "Maintaining safe, professional relationships.",
      questions: [
        "Where are the boundaries between being warm and being a child's friend?",
        "A young person asks to add you on social media. How do you respond?",
        "How do you keep boundaries when a child becomes very attached to you?",
      ],
    },
    {
      area: "Behaviour & de-escalation",
      intent: "Managing challenging behaviour safely and relationally.",
      questions: [
        "Describe how you would de-escalate a young person who is becoming aggressive.",
        "What's your view on physical intervention, and when it is and isn't appropriate?",
        "How do you keep yourself and others safe while staying relational?",
      ],
    },
    {
      area: "Missing from care & exploitation",
      intent: "Response to missing episodes and CSE/CCE risk.",
      questions: [
        "A young person is missing from the home. What do you do, and in what order?",
        "What signs might make you worry a child is being exploited (CSE or CCE)?",
        "How would you respond on a return-home conversation?",
      ],
    },
    {
      area: "Trauma-informed practice & PACE",
      intent: "Understanding of trauma, attachment and PACE.",
      questions: [
        "What does trauma-informed care mean to you in practice?",
        "Tell us how you'd use PACE (playfulness, acceptance, curiosity, empathy) with a dysregulated child.",
        "How do you avoid taking challenging behaviour personally?",
      ],
    },
    {
      area: "Recording, escalation & professional curiosity",
      intent: "Accurate records and a questioning, child-centred stance.",
      questions: [
        "Why does accurate, timely recording matter, and what makes a good record?",
        "What does 'professional curiosity' mean to you? Give an example.",
        "Who would you go to if you felt a concern wasn't being taken seriously?",
      ],
    },
    {
      area: "Reflection on the application",
      intent: "Probe gaps, changes and anything flagged at shortlisting.",
      questions: [
        "Talk us through any gaps in your employment history.",
        "Is there anything in your background you'd want to tell us about up front?",
        "What's the hardest feedback you've had, and what did you change?",
      ],
    },
  ];
}
