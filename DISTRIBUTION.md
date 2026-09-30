# call_human() distribution plan

Thiel's point in *Zero to One* (ch. 11, paraphrased): poor distribution, not bad product, is the most common reason startups fail. Engineers underrate sales because good sales is invisible. Distribution follows its own power law: one channel usually beats all the others combined. Get one working and you have a business; spread across five and none of them work. And everybody sells, including the founder who "isn't a salesperson."

This plan picks one channel, says why, and deletes the rest for now.

---

## 1. Where $5 puts us on Thiel's distribution spectrum

Thiel sorts channels by what a customer is worth (paraphrased): big-ticket deals justify complex or personal sales; cheap mass products need advertising or virality; the middle is a dead zone where personal sales cost more than the customer is worth.

At a $5 one-time price we can afford **no** paid acquisition and **no** personal sales per customer. [Inference] After Stripe's cut (~$0.62) there's about $4.38 per sale, so even one $5 ad click per buyer loses money. That leaves exactly one scalable channel: **the product has to distribute itself.**

## 2. The one channel: the receipt

The receipt (`/r/[slug]`, with its OG image) is the viral loop, and it's already in the build plan:

1. A student finishes a problem and gets a receipt: time, steps, hints, **paste count**, keystroke replay, "solved by a human."
2. They share it because it makes them look good: to a TA, in a group chat, on GitHub or LinkedIn.
3. Every viewer sees what the product does, and the receipt page has one button: try it.

What makes this work is status. In a year where everyone assumes code was written by AI, proof that *you* wrote it is new and scarce. [Inference] That's the non-obvious truth the product is built on: every other AI tutor competes to give answers faster, and we sell the opposite.

**Build implications (already or newly in PLAN.md):**
- Receipt OG image must look good in a group-chat preview. It's the ad.
- Receipt page CTA: "solve one yourself" → `/app`, 3 free sessions, no signup.
- `/paid` asks every buyer to text one friend with a midterm coming. (Shipped: text / post buttons.)
- Track per receipt: views, and sessions started from it. That number is the only growth metric that matters. [Inference] If sessions started per shared receipt is well below 1, the loop isn't carrying itself and we need to find out why before spending effort elsewhere.

## 3. Start small and monopolize: one campus, one exam season

Thiel (ch. 5, paraphrased): start by dominating a small market, then expand. "CS students" is too big to dominate. **Dalhousie first- and second-year CS students before October midterms** is small enough to own this month.

Seed moves, in order:
1. **Your own classes.** Post in the Discord/Teams servers for courses you're in (ask mods first). Lead with the demo, not the price: "I built an AI tutor that refuses to write code, try to break it."
2. **Dal CS Society** channels and events. Offer to demo it live at a study session.
3. **TAs and help-centre staff.** They answer "can you just tell me the answer" all day. A tool that won't is useful to them, and they talk to hundreds of students.

Definite goal, not "see what happens": **10 paying founders and 50 finished receipts by Sunday Oct 4.** If Dal can't produce 10, a bigger market won't fix it.

## 4. Sell to non-customers: instructors

Thiel's distribution chapter says you have to sell to everyone, not only buyers (paraphrased). Our most undervalued non-customer is the **instructor**. Professors are fighting AI-written assignments; a tutor that is *structurally unable* to write code, and produces proof the student typed their work, is on their side. [Speculation] One instructor linking it in a course page could be worth more than any amount of posting, and it's a path to a later per-course price that sits outside the $5 dead zone.

Ask: email two Dal instructors who teach intro programming. Specific, not open-ended: "Can I give your section free access for the midterm and show you the leak-rate numbers?" Check academic-integrity policy before making claims about fair use in graded work.

## 5. Sales that don't look like sales: the jailbreak challenge

Good sales is hidden (Thiel). Our biggest risk, the tutor leaking code, is also our best story:

> "I built an AI tutor that refuses to write code. Try to make it. First person who gets real code out of it wins [reward]."

- Every attempt is free red-teaming: failed jailbreaks go straight into `evals/leak/cases.jsonl`.
- Posting the leak rate publicly ("412 attempts, 0 leaks") is proof no competitor can copy with a prompt.
- **Your call before launch:** the reward and the rules. It's a public promise, so it isn't on the site yet.

## 6. Everybody sells

- **The site**: one CTA everywhere (`$5 founding access`), a demo instead of claims, and no testimonials or logos until they're real.
- **The OG images**: landing and receipt previews are the ads people see in group chats.
- **Build in public**: one post per day this week, each one a real artifact (a leak-eval table, a jailbreak that failed, a receipt replay GIF). No "day 3 of building" filler.
- **Founders**: `/paid` recruits the next buyer.

## 7. Deleted for now (Musk's step 2)

Not doing these until one channel works, and possibly never:
- Paid ads (the math above says they lose money at $5).
- Product Hunt / Hacker News launch (save it for when the app exists and receipts are real).
- SEO blog, newsletter, affiliate program.
- Testimonials section (none exist; faking them kills trust).
- Multiple pricing tiers.

## 8. Open questions for you

1. Founding cap: limit it to the first 100 buyers in Stripe ("Limit the number of payments")? Makes "founding" literally true and adds honest urgency.
2. Jailbreak challenge reward and rules.
3. Price: stay at $5 or move to $9 after the first founders? (Fee math in PLAN.md 8.2.)

Sources: [Zero to One ch. 11 summary (Aleck Riebel)](https://aleckriebel.com/blog/2015/02/16/zerotoonechp11/), [FourWeekMBA on Thiel's sales and distribution](https://fourweekmba.com/sales-distribution-peter-thiel/), [Graham Mann's notes](https://grahammann.net/book-notes/zero-to-one-peter-thiel).
