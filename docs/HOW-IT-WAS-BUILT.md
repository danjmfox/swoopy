# How Swoopy was built

> You guessed it. Claude wrote this, following another chat. I'm including it verbatim to show what it said. I _might_ manually rework it in my own words.

This document is an honest account of how this project came to exist. It is not a tutorial or a polished post-mortem. It is an attempt to think clearly about something that felt remarkable while it was happening, and to share that thinking with anyone who might find it useful or want to push back on it.

---

## Who I am

I am an agile coach and ex-software developer. I have a background in software development — enough to read code, hold architectural opinions, and know when something smells wrong. But I am not a working TypeScript developer. I had never used Canvas 2D, Zustand or Vite. I was not the person who should have been able to build this.

And yet here it is.

---

## What was built

Swoopy is a browser-based causal loop diagram simulator — a modern, extensible rebuild of Nicky Case's wonderful [Loopy](https://ncase.me/loopy/), extended with concepts from the [LeSS systems thinking](https://less.works/less/principles/systems-thinking) notation.

Under the hood it is a pnpm monorepo with three packages:

- **engine** — a pure TypeScript simulation core: signal propagation, constraint resolution, serialisation, geometry. No browser dependencies, fully tested in Node.
- **renderer** — a Canvas 2D draw loop running outside React's reconciler at 60fps.
- **app** — React + Vite + Zustand. The UI, store, pointer handling, persistence, history.

It has 354 commits, ~98% TypeScript, a comprehensive test suite, a detailed PRD, decision records for every significant architectural choice, a user guide, and this document.

A reasonable estimate suggests a competent TypeScript developer would need 300–440 hours to build this from scratch. A developer unfamiliar with the stack — say, a Python developer — probably 600–1,000 hours, factoring in learning time and the compounding confusion of an unfamiliar toolchain.

We built it in roughly 13 Claude Code sessions. At a generous estimate, that represents 30–60 hours of focused time on my part.

I want to be careful about what that number means and what it doesn't.

---

## How it actually worked

The process was collaborative in a specific way that I think matters.

**Claude Code wrote the code.** Not in the sense of autocompleting lines — in the sense of generating entire files, packages, test suites, and architectural scaffolding from specification. I did not write the signal propagation engine. I did not write the Canvas draw loop. I did not write the Zustand store actions. Claude Code did all of that.

**I provided the frame.** Every significant decision came from me:

- The domain model — what a causal loop diagram needs to do, semantically and for facilitators
- The architecture — pure engine with no browser dependencies, RAF loop outside React, branded IDs, immutable state
- The simulation philosophy — no intrinsic decay, qualitative not quantitative, deliberately imprecise (see the PRD, §1.1)
- The product decisions — which features serve the facilitation use case, which are scope creep, what belongs in v2
- The quality bar — when something felt wrong, when to refactor, when to write a decision record instead of just moving on

What Claude Code cannot do — at least not without that frame — is hold a coherent vision across dozens of decisions made over multiple sessions. Without the PRD, the architecture document, the decision records, and the discipline of writing those things down before asking for code, 354 commits of coherent, well-structured TypeScript does not happen. You get 354 commits of drift.

---

## The methodology mattered as much as the tool

This is the thing I find most interesting, and the thing I suspect gets lost in most "I built X with AI" stories.

Each session started with context: the PRD, the architecture document, the current state of the codebase. Each significant architectural decision was captured in a decision record (`.drctl.yaml`, the `docs/` folder) before the next session began. When something emerged from use — a feature that wasn't in the PRD but clearly needed to exist — it was written into the PRD before it was implemented. The PRD has a `emerged from use` annotation for exactly this: things that became clear only through doing.

This is, broadly, how good software teams work. Write down what you intend. Build it. Notice what you got wrong. Update your understanding. Repeat. The AI did not change that loop — it compressed the implementation step dramatically.

What surprised me is how much the discipline of writing things down became _more_ important, not less. Because the model has no persistent memory across sessions, the documents are the memory. Vague thinking produces vague results much faster than it does with a human developer. The PRD forced me to be precise about things I might otherwise have left fuzzy.

---

## What this might mean — and what it might not

I want to be honest about the uncertainties here.

**The productivity gain is real, but the comparison is slippery.** I was not a zero-knowledge user. I had enough background to make good architectural decisions and to recognise bad ones. Someone without that background would have a harder time providing the frame, regardless of how capable the tool is. The bottleneck shifted — from _can you write the code_ to _can you think clearly enough about the problem to direct something that can_ — but the bottleneck did not disappear.

**The domain knowledge was entirely mine.** The simulation philosophy, the facilitation use case, the LeSS notation decisions, the modelling approach — none of that came from the model. It came from years of running systems thinking sessions with teams. A tool that models causal loop diagrams built by someone who doesn't understand causal loop diagrams would be a different and worse thing.

**I do not know how much I would have learned by building it the traditional way.** There is a real question about what is lost when implementation is abstracted away. Building the signal propagation engine by hand would have deepened my understanding of it. I understand it conceptually; I am less sure I understand it the way you understand something you have debugged at 11pm. That is a genuine tradeoff, not a solved problem.

**This is one data point, not a proof.** Swoopy is a particular kind of project — relatively self-contained, well-defined domain, no external API dependencies, a clear vision from the start. Different projects may behave very differently.

---

## Questions I am sitting with

- Is the frame-providing skill teachable, or does it require a kind of background that is hard to acquire without building things the old way first?
- What happens to the craft of software development when implementation is compressed? What do we lose, and is it worth losing?
- Does the quality of the output actually reflect the quality of the thinking, or does the model paper over some gaps that would have been caught in a traditional build?
- What does this mean for teams? Can a group of domain experts with limited development background now build production-quality tools? Should they?
- How does this change what we should teach, and who we should hire?

I don't have confident answers to any of these. I find them genuinely interesting and a little unsettling.

---

## An invitation

If you have built something this way and had a different experience — better or worse — I would like to hear about it. If you think my interpretation of the productivity numbers is wrong, or that I am understating what the model contributed, or overstating it, I would like to hear that too. If you are a developer who has thoughts about what this means for the profession, those thoughts are welcome.

The code is here. The PRD is here. The architecture document is here. The decision records are here. If you want to understand how a decision was made, there is usually a document explaining it. That transparency is intentional.

Raise an issue. Start a discussion. Disagree with something.

— Dan Fox
