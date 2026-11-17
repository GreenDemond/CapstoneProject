# Design: mood check-in (proposed, not built)

Status: **proposed only.** Not part of the build yet.

## What the upload suggests

The ADHD Buddy app has five mood choices for diary entries: Bright, Steady, Foggy, Heavy, Tender. Its diary stores audio. We would not copy the audio, and we would not send anything to a service.

## What the research supports

- **Mood tracking in students with ADHD:** no direct study found in a search (2026-11-17). Self-monitoring of academic behavior has promising results in a small randomized study of college students with ADHD, but all measures were self-report and the sample was small (`https://sharpbrains.com/blog/2015/01/07/can-self-monitoring-help-pr`, and the study it reports). It does not show that mood tracking helps.
- **Self-report scales:** a 2022 study of 267 Spanish secondary students found a self-report ADHD questionnaire had good properties (`https://pmc.ncbi.nlm.nih.gov/articles/mid/NIHMS1673889` is a related search result; not read in full). It is not about mood.

So a mood check-in is **design judgment, to be tested**. It must not be described as improving focus or as a measure of anything.

## Rules that apply

- Data stays on the device (T3). Mood is more sensitive than task data, so it is kept only if the student saves it, and they can clear it.
- No report to parents or teachers (rule 5). No diagnosis questions (rule 3).
- A low mood must not trigger a red warning. If a student writes something worrying, rule 11 applies: the app points to a trusted adult.
- The app does not comment on the mood or use it to judge the day.

## Proposed shape, if approved

- Optional, one tap, after a finished step: "How are you right now?" with the five words above, plus "Skip."
- Shown in the profile as a list of the student's own taps, newest first. No averages, no trends, no streaks.

## Decisions for Ben

1. Include a mood check-in at all, or leave it out for the beta?
2. If yes, keep the five words, or use your own?
