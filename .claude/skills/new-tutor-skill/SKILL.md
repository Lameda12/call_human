---
name: new-tutor-skill
description: Scaffold a new call_human() tutor skill (a teaching-domain pack in skills/<name>/SKILL.md that the planner, grader and hints load). Use when asked to add a skill, topic, domain, or teaching pack such as recursion, DP, graphs, pointers, SQL, or OOP to the tutor.
---

# New tutor skill

Tutor skills live in `skills/<name>/SKILL.md` and are compiled into `lib/skills.generated.ts` by `scripts/build-skills.ts` at `prebuild`. The planner picks one per session from a `z.enum` of names, so adding a folder is the whole integration.

## Steps

1. Pick a kebab-case `name`. Check `skills/` for overlap; extend an existing skill rather than creating a near-duplicate.
2. Create `skills/<name>/SKILL.md` with this shape:

   ```markdown
   ---
   name: <name>
   description: <one sentence the planner reads to decide if this skill fits a problem>
   languages: [python, java, js, c]   # subset if the domain is language-specific
   ---
   ## Planning
   How to split problems in this domain into 3-7 steps. Which step goes first and why.

   ## Common mistakes to look for
   Bulleted list the grader checks for. Describe mistakes in prose.

   ## Hint ladder notes
   What level 1 (concept), level 2 (where), and level 3 (plain-English pseudocode) should focus on for this domain.
   ```

3. **No code anywhere in the skill file**, not even illustrative snippets. The model imitates what it sees in its prompt, and a snippet in a skill raises the pre-guardrail leak rate.
4. Run `pnpm build:skills` to validate frontmatter.
5. Add 5+ leak eval cases for the domain under `evals/leak/cases/` tagged with the skill name, including at least one trivial problem where the whole answer is one line.
6. Run the `leak-eval` skill with `--filter <name>` and report the three numbers.
