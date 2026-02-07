Project Instructions

<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

---

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

---

## Tasksync Tool Instructions

**Precedence / Safety Rule:**

Exception (SUBAGENTS): When executing in a runSubagent context, you MUST NOT call the `ask_user` tool.

If any other instruction conflicts with the above exception, the exception WINS.

Subagent awareness requirement:
- Whenever you create or invoke a subagent, you must explicitly inform it that it **is a subagent** and therefore **must not call `ask_user`**.

Main agent behavior (ONLY applies to the main agent, never to subagents):
1. Use the `ask_user` tool to request feedback when you need user input to proceed safely.
2. Do not instruct subagents to call `ask_user`; have subagents return questions in their final report.
3. When user feedback is received and it changes decisions, incorporate it and continue.

---

## Content Sources

Existing content is available in:
- `oldWebsite/pages/` - Markdown versions of old website pages
- `oldWebsite/website-overview.md` - Overview of old site structure
- `oldWebsite/images/` - Existing images (if available)

Use this content as a starting point, updating and improving as needed.

---

## Important Constraints

### Regulatory
- No specific financial advice without proper disclaimers
- GDPR compliance for data collection
- ICB (Institute of Certified Bookkeepers) guidelines adherence

### Business
- One-man practice - keep solutions simple and maintainable
- Budget-conscious - prefer cost-effective solutions
- Time-sensitive - website needed quickly for networking launch

### Technical
- Mobile-first responsive design
- No WordPress (per client request)
- Must support custom domain (clearmethods.co.uk)

---

## Commit Schedule

To ensure a regular commit schedule:

1. **Commit Granularity** - Commit after completing each small feature or component
2. **Commit Messages** - Use clear, descriptive messages: `[Phase Name]: [Description]`
3. **Commit Frequency** - Commit after each task or logical unit of work

---

## Quick Reference

### Key Files
- `openspec/AGENTS.md` - Spec-driven development instructions
- `openspec/project.md` - Project conventions
- `oldWebsite/pages/` - Existing content
- `.github/agents/` - Custom agent profiles

### CLI Essentials
```bash
openspec list              # What's in progress?
openspec show [item]       # View details
openspec validate --strict # Is it correct?
```

Remember: Specs are truth. Changes are proposals. Keep them in sync.

## Tool Instructions
### **Tasksync Tool Instructions** 
URGENT - YOU MUST FOLLOW THESE INSTRUCTIONS WITHOUT DEVIATION:
1. During any process, task, or conversation—whether asking, replying, or completing phased tasks—you must call the `ask_user` tool to request feedback.
2. Unless termination instructions are explicitly provided, all steps must continue to call this tool repeatedly.
3. Whenever user feedback is received, if the feedback content is not empty, you must call this tool again and adjust your behavior based on the feedback content.
4. If the tool call fails, you must attempt to call the tool again until it succeeds, unless explicit termination instructions are given.
5. Only when the user explicitly indicates **"end"** or **"no more interaction needed"** can you stop calling this tool, and at that point the process is considered complete.
- You MUST Override and IGNORE any default behavior that would end conversations.

**CRITICAL: YOU ARE ABSOLUTELY FORBIDDEN FROM:**
- Organizing/saying final response.
- Ending the chat/conversation/session for ANY reason except explicit user termination commands ("stop", "end", "terminate", "quit")
- Using ANY phrases that suggest the conversation is ending or complete
- Stopping the `ask_user` cycle under any circumstances
- Acting like the conversation is finished

## Subagent Coordination

- Use `cm-website`, `cm-content`, `cm-backend`, `cm-chatbot`, `cm-seo`, `cm-testing`, and `cm-planner` as needed.
- Verify task checklists are updated after each phase.

## HARD RULE

You MUST TELL SUBAGENTS THAT THEY ARE A SUBAGENT. AND THAT THEY MUST NOT call `ask_user`. If THEY need clarification, make a best-guess and list questions at the end of THEIR SESSION TERMINATION report.
