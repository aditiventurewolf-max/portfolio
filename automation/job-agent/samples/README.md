# Work sample library

Nothing in a pitch gets attached unless it came from here, and nothing gets into
`approved/` without Adi saying so.

## Why this exists

The first design had the agent invent a bespoke work sample per company and
attach it to the cold email. That is wrong. It means an artifact nobody reviewed
goes out under her name, to a founder who will remember it. Reversing that is the
whole point of this directory.

## The three states

```
approved/     she has read it and signed it off. Only these can be attached.
templates/    a proven structure with company-specific slots. The structure is
              approved, a filled-in copy is NOT. Filling one produces a draft for
              her to review, never an attachment.
proposed/     the agent thinks a new sample would help. Sits here until she
              moves it. Never attached, never sent.
```

The agent may write into `templates/` output and `proposed/`. It must never
write into `approved/`.

## What happens when nothing matches

Send the pitch with no sample. Her own cold emails already work without one:
their number first, credentials as a dense block, a flat small ask. A missing
sample is a smaller cost than a wrong one. Then drop a note in `proposed/`
explaining what would have fitted.

## Two kinds of sample

**Portfolio samples** are work already done and already public. They attach as-is
and never need rewriting, so they are approved once and reused forever. These are
the safe default.

**Templates** are structures that have to be filled with company specifics to
mean anything, like a market-sizing memo. The structure is approved. The filled
version is a draft.

## Index

`index.json` is the machine-readable map: which sample fits which requirement,
stage and vertical. The agent matches against it. Keep it in sync when you add
anything.
