# Alpha School and Montessori: what to borrow, what to leave

Research notes written 2026-11-16 for the question: **which workflows and ways of presenting work do these two approaches use that this app could borrow?**

Alpha School is a screen-based, reward-driven private school network. Montessori is a 100-year-old method with no screens and no rewards. They disagree on almost everything, which makes the places they agree worth noticing.

**Read this first.**

- Nothing in this file is evidence that a feature helps students with ADHD. Neither approach has been tested for that (sections 2.5 and 3.3). Every idea in section 5 is tagged **[Borrowed pattern]**, which means design judgment to be tested in the beta, the same as **[Judgment]** in file 04.
- Nothing here changes `DECISIONS.md`. Ideas that would need a decision are listed in section 6.
- Do not write "used by Alpha School" or "based on Montessori" in the app or the write-up as if it were proof. Supported wording stays in `00-knowledge-summary.md` section 6.
- How much of each source was read is listed in section 7. Much of the Alpha material is marketing or journalism, not research.

---

## 1. The short version

1. **Alpha's own people say the software is not what makes it work.** The founder puts it at "10 percent" software and "90 percent" a motivated student. The same lessons done at home without the school around them were "a fight every time" for one family, and Alpha's home pilot ran at about normal speed. An app on its own should expect modest use.
2. **Alpha's best presentation ideas are about making the finish line visible:** today's target, a ring that closes for each work block, a projected finish date, and free time as the prize.
3. **Alpha's worst outcomes come from the same machinery turned up:** webcam monitoring, a "waste meter", students ranked by name, prizes and food tied to metrics, and targets that slip further away while a student is stuck. Reported results include a child who stopped eating and children who lost interest in school. Every one of these already breaks a rule in `AGENTS.md`.
4. **Montessori's best ideas are about the task itself:** one difficulty at a time, work that shows the student whether it is right without an adult, everything laid out before starting, a fixed cycle of choose, set up, do, put away, and choice within limits.
5. **Montessori evidence is real but modest, disputed, mostly from young children, and silent on ADHD.**
6. **Where both agree:** work at the student's own level and pace, do not move on with gaps, the adult guides instead of lecturing, progress is concrete and visible, the student gets some choice, and work happens in protected blocks of time.
7. **Where they disagree, this project's rules already pick a side:** no surveillance, no ranking, no prizes, nothing that punishes a lapse.

---

## 2. Alpha School

### 2.1 What it is

- A for-profit network of private schools, started in Austin, Texas in 2014 by MacKenzie Price. Software billionaire Joe Liemandt funds it and holds the title of principal. About 1,500 students on about 50 campuses; tuition up to $75,000 a year (New York Times, October 2026).
- The pitch: students "learn 2x in two hours" of app-based academics each morning, then spend afternoons on projects and "life skills".
- There are no teachers in the usual sense. Adults are "guides" whose job is motivation and emotional support, not lessons. About one-third have education training (a National Education Policy Center analysis, as reported by CBS News).
- The software platform is called **Timeback** (also written TimeBack; sold to public schools as "Studient"). About 7,000 students use it in total, including about 2,600 in public schools.

### 2.2 The apps

| App | What it does | Source |
|---|---|---|
| **Dash** (Timeback home page) | Shows the year's goals cut into weekly and daily pieces, today's target, time "given back", and a projected finish for each subject | Alpha student newsletter |
| **AlphaRead** | Short AI-written articles kept close to the student's reading level, each followed by guiding and comprehension questions | Alpha student newsletter |
| **AlphaWrite** | Writing taught in order: sentences, then paragraphs, then essays, with feedback on each attempt | Alpha student newsletter |
| **AlphaMath Fluency** | Math-fact practice | Alpha student newsletter |
| **TeachTales** | Choose-your-own-adventure stories built from the student's interests and friends' names, to build a liking for long reading | Alpha student newsletter |
| **Incept** | The engine that generates lessons from what a student knows and what they like | Alpha blog; Colossus profile |
| Outside apps | Math Academy, Synthesis, Khan Academy, Membean, and others, run inside Timeback. Until mid-2025 the main app was IXL | Alpha student newsletter; ACX review |

Two facts that cut against the "AI tutor" label:

- **There is no chatbot.** Students do not ask an AI questions and do not get answers from one. The AI works behind the scenes choosing and generating practice (New York Times; CBS News). This matches rule 1 here, hints never answers.
- **IXL ended Alpha's account in July 2025** for breaking its terms of service, and said its product is "not intended" as "a replacement" for "trained, caring teachers" (Wired, October 2025).

### 2.3 The daily workflow

Pieced together from Alpha's blog, a student newsletter, and a parent's long review. Details differ by campus and year.

1. **Open the home page and see today's target.** The year is already cut into daily pieces. The student does not plan; they see what today asks.
2. **Work in 25-minute blocks.** Alpha calls them Pomodoros. A ring closes when a block is finished at the required accuracy.
3. **Credit needs accuracy, not just completion.** Below 80% (90% in some descriptions) the student still moves on, but earns nothing for that lesson, and the missed questions come back later. Alpha says this stops rushing.
4. **Points are tied to time.** 1 XP stands for one minute of focused work. The daily target is 120 XP. Timeback's own documentation lists zero XP for focused work that falls short of mastery, and *negative* XP for gaming the system.
5. **When stuck:** re-read the problem, use the hints inside the app, and only then book a video call with a remote coach. Guides are told not to step in with the answer.
6. **Finishing the morning unlocks the afternoon** and earns school currency.
7. **An end-of-day report** shows minutes per subject, accuracy, and lessons mastered.
8. **A "check chart"** lists what a student must do to move up a level, including non-academic items such as giving a tour of the school. Students choose which item to work on next, and can move up at five points in the year.

### 2.4 How it motivates

A parent who moved his family to Austin for the school wrote that the incentive system is the "secret sauce that doesn't get mentioned in the PR copy" and "at least as important" as the technology.

| Mechanic | How it works |
|---|---|
| School currency | About 10 "bucks" (worth ten cents each) for finishing the daily minimum; more for extra lessons, for finishing inside the scheduled time, and when the whole class finishes. Spent in a school store |
| Cash and big prizes | Up to $1,000 for high test scores; trips; electronics (New York Times) |
| Privileges | Sitting next to friends, bean bag seats |
| Time back | The home page shows how much time the student has saved compared with ordinary school. Alpha's blog calls time "the ultimate currency" |
| Leaderboard | Students ranked by name on XP (New York Times) |
| Waste meter | See below |

**The waste meter.** A camera-based "vision model" watches the student and flags "anti-patterns": rushing, spinning in the chair, socializing, checking Instagram, scrolling without reading, skipping explanation videos, and "topic-shopping" (switching subject when one gets hard). An always-visible meter shows how much free time the student is losing. Alpha presents this as coaching: "you're wasting 50% of your time. And the kids like, whoa, coach me up."

**The parent review's explanation of why rewards work here.** It cites economist Roland Fryer's experiments: paying students for things they fully control and understand (reading a book, arriving on time) changed behavior, while paying for test scores did nothing, because students did not know which actions would raise a score. Alpha pays for finished lessons, not for scores. *(Fryer's studies were not read for this file; this is the reviewer's summary.)*

### 2.5 Does it work? Rating: **Weak**, and **None** for ADHD

- **No independent study exists.** A Brookings researcher who has visited: "There's no clear externally validated evidence around the results they claim" (CBS News). Every growth figure comes from Alpha.
- **Alpha's own data falls short of its slogan.** Internal figures seen by the New York Times (about 400 students, fall 2025 to early 2026): about half missed "2x" growth in math, about a fifth missed it in reading, and 42% reached it in both. Three-quarters grew at least as fast as the national projection.
- **The students are not typical.** The median student scored at the 87th percentile in math before any comparison. Families pay up to $75,000 and choose the school. Some students who struggle leave or are pushed out.
- **It works less well for students who start lower.** Of those at or below the 50th percentile in math, 37% reached 2x. The Houston superintendent piloting it said he is "a little skeptical for kids who struggle".
- **The software alone does little.** Same software in Alpha's home pilot, without guides or rewards: about normal speed (parent review). A teacher who compared Alpha's published numbers found growth was about the same before and after its $100 million software rebuild, and concluded "motivation, not technology" drives it.
- **This matches a wider finding.** Studies of Khan Academy, IXL, and similar apps report gains "for students who used the program as recommended". In the Khan Academy study that was 4.7% of students (Education Next, "The 5 Percent Problem").
- **ADHD:** no data. The sources contain one supportive anecdote (a father whose twins had "struggled to focus" elsewhere) and one harmful one (a student with "sensory issues and hyperactivity" who began hurting herself).

### 2.6 What went wrong

These are reported cases, not rates. They matter because each one is a specific design choice failing.

| What happened | The design choice behind it | Source |
|---|---|---|
| A 9-year-old was made to repeat a hard multiplication task more than 20 times; each error added more questions. She said she would "rather die" than continue | Being stuck increased the workload | Wired |
| While she was stuck, she "had fallen even farther behind her targeted goals", and skipped lunch to catch up | Targets kept moving while the student could not | Wired |
| The same child, who had a doctor's note to eat snacks, said staff told her she had not earned them until she met her metrics | Everyday things turned into rewards | Wired |
| "I told myself I don't eat unless I get something right... everything became a reward" | The same, absorbed by the student | Wired, via a summary |
| A student at home was flagged for an "anti-pattern" and sent webcam video of herself in pajamas talking to her sister | Monitoring instead of self-monitoring | Wired, via a summary |
| Parents reported "negative self talk" from children ranked against classmates by name | Leaderboard | New York Times |
| Stuck students waited "several days" for a tutor. Alpha staff call being stuck in the apps the "doom loop" | No quick way out of stuck | New York Times |
| After leaving, one child took most of a year to get back her "love of learning"; another had become "a work machine" | Heavy outside rewards | Wired, via a summary |
| In one classroom elsewhere, help videos counted as a "hint" and cost points, so students stopped watching them | Penalty for asking for help | Education Next |

---

## 3. Montessori

### 3.1 What it is

A method developed by Maria Montessori, an Italian doctor, from 1907. A teacher (called a guide) prepares a classroom of hands-on materials. Children choose their own work during a long uninterrupted period, usually three hours. There are no grades, no rewards or punishments, and no competition set up between children. Most Montessori schools serve ages 3 to 12. The name is not protected, so schools using it vary widely.

### 3.2 The workflow and the principles behind it

| Principle | What it looks like in the classroom |
|---|---|
| **Prepared environment** | Everything needed is laid out, in order, within reach, before the child starts. The adult's main work happens beforehand |
| **Isolation of one difficulty** | Each material teaches one idea only. The pink tower's ten cubes differ in size and nothing else: same color, no numbers on them |
| **Control of error** | The material itself shows a mistake, so the child corrects it without an adult. A piece is left over, or does not fit |
| **The work cycle** | Choose the work, carry it to a mat that marks your space, do it, repeat it as often as you like, then put it back ready for the next person. Setting up and putting away count as part of the work |
| **Uninterrupted time** | About three hours with no bell and no adult breaking in on a child who is concentrating |
| **Choice within limits** | The child chooses what, where, with whom, and for how long, inside the class rules. The guide steps in for a child who cannot choose or is disturbing others |
| **Concrete before abstract** | Ideas are handled as objects first, and the child drops the objects once they are no longer needed |
| **Guide, not lecturer** | The guide observes, then gives short lessons to one child or a small group, and decides what to offer next from what was observed |
| **Work journal and conference** (ages 6–12) | Students record the work they chose. In regular one-to-one meetings the student and guide agree goals and follow-up work. A teacher-trainer warns that a plan "should not be the main driver of the child's day" |
| **No rewards, grades, or competition** | Interest and finishing are meant to be the reward |

Angeline Lillard, the psychologist who has studied the method most, lists eight research-backed principles in her book *Montessori: The Science Behind the Genius*. Four bear on this app: people "thrive when they feel a sense of choice and control"; we learn best when interested; children "thrive on order, routine, and ritual"; and "extrinsic rewards reduce motivation and level of performance once the rewards are removed". *(Read from the publisher's summary, not the book.)*

### 3.3 Does it work? Rating: **Moderate** for young children, **Weak** for teenagers, **None** for ADHD

- **A 2023 pooled review found modest benefits.** Across 32 studies: about a quarter of a standard deviation on academic outcomes (g = 0.24) and a third on non-academic ones such as executive function and liking school (g = 0.33). Effects were smaller in middle and high school (Randolph et al., Campbell Systematic Reviews).
- **A 2026 review disputes that.** It found the large average effects in the literature "largely attributable to structural weaknesses of the evidence base" such as publication bias, without concluding there is no effect (León et al., Review of Educational Research).
- **The best single trial is in preschool.** A 2025 lottery study of 588 children at 24 public Montessori schools found gains by the end of kindergarten in reading, executive function, and short-term memory, and none in math, vocabulary, or persistence. Many families did not take part and many children were missing at follow-up (Lillard et al., PNAS).
- **One study covers the age group of this project.** About 290 matched middle school students were signalled at random moments and reported how they felt. Montessori students reported more interest, energy, and flow during schoolwork. The groups were matched, not randomly assigned, and no grades or test scores were measured. The authors guessed at the causes: at least two hours a day "to exercise choice and self-regulation", no mandatory grades, and grouping by interest (Rathunde & Csikszentmihalyi 2005).
- **ADHD: almost nothing.** A Montessori educator who searched the literature found two small studies, one measuring only adults' impressions, and no large controlled study. Her summary: the research "does not prove it. It does not disprove it either." She also names the risk: the long work period "one child experiences as freedom may be, for another, three hours without enough external structure."
- **Selection applies here too.** Families choose Montessori, and private Montessori shows larger effects than public.

**On rewards, the two approaches clash, and so does the research.** Lillard says rewards reduce motivation once removed. Other researchers find rewards can *raise* interest in tasks that started out boring. *(Both positions read from a Wikipedia summary of the debate only.)* This project's own evidence rates immediate rewards **Strong** for on-task behavior in students with ADHD. The position already in `AGENTS.md` sits between: small, immediate, built up and never taken away, the same for honesty as for finishing, and no prizes.

---

## 4. Side by side

| | Alpha School | Montessori | This project |
|---|---|---|---|
| Who plans the work | The software sets today's target | The child chooses, the guide steers | The app suggests, the student edits (P1) |
| Size of a piece of work | 25-minute block | One material, one idea | One step on screen (P3) |
| How the student knows it is right | Score against an accuracy bar | The material shows the error | Not designed yet; see M1 |
| When stuck | Re-read, in-app hint, then book a coach | Guide observes, then re-presents | Hint or pointer, never the answer (P6) |
| Watching attention | Camera and waste meter | Guide observes quietly | The student reports on themselves (P4) |
| Rewards | Currency, cash, prizes, privileges, ranking | None | Small, immediate, never removed, no ranking |
| After a lapse | Falls behind target | No penalty; choose again | "Pick up here", nothing about the gap (P8) |
| Interruptions | Meter always visible | Protected | Check-in only at step changes (D4) |
| Records | Dashboard for parents and staff | Student's journal, shared in conference | On the device; the student decides who sees it |
| Screens | All academics | None | A web app, used briefly |

**Where all three agree:** small pieces, own pace, nothing skipped, visible progress, an adult or tool that guides instead of doing the work.

---

## 5. Ideas for this app

All tagged **[Borrowed pattern]**: design judgment, to be tested. Cross-references are to file 04 (D and G numbers) and `DECISIONS.md` (P numbers). Ideas already in files 04 or 05 are noted as confirmed, not repeated.

### From Alpha

**A1. "Today" comes first.** Opening the app shows one thing: today's piece of the current assignment, already chosen. Alpha students do not decide what to do each morning; they see it. This sharpens D8 (resume screen) and P8.

**A2. A ring that closes per step.** A ring or shape that visibly closes when a step is finished. It closes the same way for Done and for Drifted (rule 6). A possible fourth option for Ben's progress-display choice, or a small addition to whichever he picks.

**A3. "At this pace" line.** One calm line: "3 steps left. About two more sessions." Alpha uses projected finish dates to make a big job look finishable. **Required guard:** the line only ever looks forward from now. It never says "behind", never compares with an earlier estimate, and has no due-date countdown in red. The Wired case is what the unguarded version does.

**A4. A real finish line: "That's today done."** When today's piece is finished the app says so plainly and suggests closing it. Alpha's strongest motivator is free time, not points. This also fits the rule against rewarding time in the app, and is the opposite of how most apps behave.

**A5. Stuck ladder.** Alpha's order is: re-read the problem, use a hint, then ask a person. The app has the first two (P6, T5). Add the third rung: after two hints on the same step, the app suggests asking a person and helps the student write the question ("I'm on step 3. I tried ___. I don't get ___."). The student does the asking; nothing is sent anywhere.

**A6. Stuck never adds work.** A rule, not a feature: tapping Stuck or Drifted must never lengthen the list, reset progress, or change a projection for the worse. P5 (Drifted splits the step in two) keeps the same total work, so it passes. Worth adding as a test.

**A7. "Park it" in place of topic-shopping.** Alpha treats switching away from hard work as a fault to be caught on camera. The friendlier version: a "Park this step" button that asks for one line, "What will you try first when you come back?", and then lets the student pick another step or assignment. Related to D7 and D9. This adds a fifth choice to the work screen, so it would need Ben's say (section 6).

**A8. Old recall answers come back.** Alpha brings missed questions back later. Version for P9: at the start of a later session, show one earlier answer: "Last week you wrote: '...'. Still true? Anything to add?" Spaced recall has support in general; this exact form is untested.

**A9. End-of-session card.** Three plain lines: steps finished, honest check-ins, where to pick up. On the device only. Alpha sends its daily report to adults; here the student owns it and decides whether to show anyone (same as G13).

**Confirmed, already in the plan:** reward actions the student controls, not results (rule 3 of the game layer in file 04); no speed bonus; the app proposes and never answers.

### From Montessori

**M1. "How will I know it's done?"** When editing steps, each step can carry one short done-check written by the student: "Three sentences on the page." "Problems 1–5 have answers." This is control of error for homework: the step itself tells the student whether it is finished, with no adult and no AI. It also keeps the thinking with the student. The check must be optional and one line, or it becomes a form.

**M2. One difficulty per step.** A gentle nudge when a step holds two jobs ("Research and write the intro" contains "and"): "This looks like two steps. Split it?" The student can say no. Similar to the coaching level of D2, without needing AI.

**M3. "Get ready" step.** The first step of every plan is laying things out: "Open the document. Get the book. Fill your water." This is the prepared environment, and it gives D1 (a starter step under two minutes) concrete content.

**M4. "Put it away" step.** The last step of every session is closing up: save, write the title of the next step, close the tabs. Montessori counts putting away as part of the work. Pairs with D9.

**M5. Choose the next step.** Where the order does not matter, show two or three possible next steps and let the student pick, instead of forcing the list order. Choice within limits. More than three options breaks "one thing at a time".

**M6. Never interrupt a step.** No pop-ups, sounds, or prompts while a step is in progress. Confirms D4's choice to ask only at step changes. **Tension to know about:** the self-monitoring studies behind this app used checks at regular intervals, and Montessori says to protect concentration. Step-boundary check-ins are the compromise. If steps turn out long in the beta, this needs a second look.

**M7. The history is the student's work journal.** Call the record of past sessions a journal, show it in the student's own words (their step names, their recall answers), and let them add a line. Nothing is graded.

**M8. Weekly conference with yourself.** When the weekly goal (P7) rolls over, ask two questions: "What helped this week?" and "One thing to try next week?" In Montessori this is a meeting with a guide; here the student is their own observer, which is principle 5 in `00-knowledge-summary.md`.

**M9. Same order every time.** Get ready, work, check in, put away. Lillard's point about routine and ritual. This pulls against principle 4 in the knowledge summary ("vary it"). A way to hold both: keep the *order* fixed and vary the *wording and look*.

### Do not borrow

| Pattern | From | Why not |
|---|---|---|
| Camera, screen, or typing monitoring; a "waste" or "off-task" meter | Alpha | Rules 4 and 5. It replaces self-monitoring, the best-supported feature, with being watched. "Waste" is a shaming word (rule 2). Usage numbers alone were "barely effective" (file 01, section A) |
| Named leaderboards; a daily "most points" winner | Alpha | Rule 7. Parents reported negative self-talk |
| Cash, prizes, food, or privileges for work | Alpha | File 04's avoid list. This is where the worst reported harms came from. A tool Ben builds also has no place handing out prizes |
| Points that go negative, or zero credit for honest effort | Alpha | Rule 2; nothing is taken away |
| Accuracy bars that make the student repeat until perfect | Alpha | The app cannot judge answers, and this is the loop in the Wired case |
| A target that moves away while the student is stuck | Alpha | Rule 2; see A3's guard |
| "2x faster", "learn in 2 hours", or any speed claim | Alpha | Rule 8. Alpha's own data does not support its slogan |
| Three-hour work blocks | Montessori | Untested for ADHD, and named as a possible risk by a Montessori educator |
| Dropping rewards entirely | Montessori | Immediate rewards are rated Strong for this group in file 01. Keep them small |
| "Montessori-based" as a label | Montessori | The name guarantees nothing, and the evidence is disputed |

---

## 6. What this means for the project

**For the build.** Four ideas cost almost nothing and fit features already on the list in `PROGRESS.md`:

| Idea | Fits into |
|---|---|
| M3 "Get ready" and M4 "Put it away" steps | Item 2, paste and split: they are two more starter steps |
| A6 Stuck never adds work | Item 3, work screen: one extra test |
| A4 "That's today done" | Item 4, saving and coming back |
| M1 Done-check | Item 2, as an optional line per step |

**For the beta.** The clearest lesson in this file is finding 1: the tool is the small part. Expect that some classmates will open the app once. That is a result, not a failure, and the beta questions in file 04 section 6 should include "What would have made you open it again?" Whether to pair the app with a person (a study buddy, a teacher check-in) is a question about other students, so it belongs to the parent and teacher.

**For Ben's write-up.** A fair sentence: "I looked at two very different schools. Both break work into small pieces and let students go at their own pace. One uses heavy rewards and monitoring, and reporters found students harmed by it, so I left those out. Neither has been tested for ADHD."

**Choices for Ben** (none made here):

1. Should the work screen get a "Park this step" button (A7), or is four buttons enough?
2. Is a closing ring (A2) a fourth option alongside pet rock, quest map, and build-a-picture?
3. Should each step have an optional "How will I know it's done?" line (M1)?

---

## 7. Sources and how much was read

**Alpha School**

| Source | Type | Read |
|---|---|---|
| "Your Review: Alpha School", Astral Codex Ten, 2025. By a parent, later named in the press as Edward Nevraumont. https://www.astralcodexten.com/p/your-review-alpha-school | Parent account, favorable | Full text once, then re-checked by keyword |
| Goldstein D. "Students at an A.I. School Were Supposed to Learn Faster. Many Aren't." *New York Times*, 23 Oct 2026. https://www.nytimes.com/2026/10/23/us/alpha-school-ai-education-parents.html | Journalism, with internal Alpha data | Full |
| "This teacherless school says AI can teach students in 2 hours a day." CBS News, 22 Oct 2026. https://www.cbsnews.com/news/alpha-school-ai-teaching-2-hour-a-day/ | Journalism | Full |
| Feathers T. "Parents Fell in Love With Alpha School's Promise. Then They Wanted Out." *Wired*, 27 Oct 2025. https://www.wired.com/story/ai-teacher-inside-alpha-school/ | Investigative journalism | **Opening section only** (paywall). Rows marked "via a summary" come from quotations in https://terryu.substack.com/p/five-stories-buried-in-wireds-bombshell **(confirm)** |
| "How AI and Gamification Transform Learning at Alpha School." alpha.school blog. https://alpha.school/blog/how-ai-and-gamification-transform-learning-at-alpha-school/ | Marketing | Full |
| "XP system." Timeback developer documentation. https://docs.timeback.com/beta/about-timeback/concepts/xp-system | Company documentation; describes intended policy | Full |
| "Austin Scholar #177: The Alpha App Stack." https://austinscholar.substack.com/p/austin-scholar-177-the-alpha-app | Newsletter by an Alpha student; promotional | Full |
| "As an elementary school principal..." (profile of Joe Liemandt). Colossus. https://colossus.com/article/joe-liemandt-class-dismissed/ | Magazine profile | **Keyword search only** (vision model, waste meter passages) |
| Kane D. "Alpha School's Secret Sauce." Five Twelve Thirteen, 2026. https://fivetwelvethirteen.substack.com/p/alpha-schools-secret-sauce | Teacher's analysis of Alpha's published numbers | Full |
| Holt L. "The 5 Percent Problem." *Education Next*, 2024. https://www.educationnext.org/5-percent-problem-online-mathematics-programs-may-benefit-most-kids-who-need-it-least/ | Research summary | Full. The underlying Khan Academy study *(not read)* |
| "Alpha School." Wikipedia. https://en.wikipedia.org/wiki/Alpha_School | Encyclopedia | Skimmed for dates and names |
| National Education Policy Center blog, "The Price Kids Pay". https://nepc.colorado.edu/blog/fprice-kids-pay | Policy analysis | *(not read)*; cited only as reported by CBS |
| 404 Media, "'Students Are Being Treated Like Guinea Pigs'". https://www.404media.co/students-are-being-treated-like-guinea-pigs-inside-an-ai-powered-private-school/ | Investigative journalism | *(not read)*; paywall. Not relied on |
| Fryer R. Financial incentive experiments | Research | *(not read)*; known only through the parent review |

**Montessori**

| Source | Type | Read |
|---|---|---|
| Marshall C. (2017). Montessori education: a review of the evidence base. *npj Science of Learning* 2, 11. https://www.nature.com/articles/s41539-017-0012-7 | Peer-reviewed review | Introduction, method description, and start of the evaluation section in full; the rest by keyword |
| Randolph JJ, et al. (2023). Montessori education's impact on academic and nonacademic outcomes. *Campbell Systematic Reviews* 19(3):e1330. https://doi.org/10.1002/cl2.1330 | Systematic review | *(not read)*; figures from the summary at https://absorbentmind.org/for-researchers/evidence-status/ **(confirm)** |
| León SP, Lipnevich AA, García-Garrido M. (2026). The Montessori Method Under Scrutiny. *Review of Educational Research*. https://doi.org/10.3102/00346543261458396 | Meta-analysis | *(not read)*; same secondary summary **(confirm)** |
| Lillard AS, et al. (2025). A national randomized controlled trial of the impact of public Montessori preschool at the end of kindergarten. *PNAS* 122(43). https://doi.org/10.1073/pnas.2506130122 | Randomized trial | *(not read)*; same secondary summary **(confirm)** |
| Rathunde K, Csikszentmihalyi M. (2005). Middle school students' motivation and quality of experience. *American Journal of Education* 111(3), 341–371. https://doi.org/10.1086/428885 | Matched comparison study | Abstract, plus the description in Marshall 2017 |
| Lillard AS. *Montessori: The Science Behind the Genius* (Oxford University Press) | Book | Publisher's two-page summary only |
| Giménez M. "What the Research Says, and Doesn't Say, About ADHD in Montessori Classrooms." https://www.mariagimenez.bio/what-the-research-says-and-doesnt-say-about-adhd-in-montessori-classrooms | Educator's literature summary, not peer-reviewed | Full. The studies it cites (Eși 2024; Yıldırım Doğru 2015; Diamond & Lee 2011) *(not read)* |
| Rising L. "Montessori Elementary: Planning and Record Keeping Overview." Trillium Montessori. https://www.trilliummontessori.org/montessori-elementary-planning/ | Practitioner guide for teachers | About two-thirds, plus keyword search |
| "Overjustification effect." Wikipedia | Encyclopedia | Keyword search only, for the rewards debate **(confirm before quoting)** |

**Not found.** No study of Alpha School or Timeback by anyone outside the company. No controlled study of Montessori for students with an ADHD diagnosis. No description of the Montessori work journal from the student's side for ages 12 and up.
