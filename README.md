# Design Boilerplate

A starting point for building websites with an AI agent.

Most AI-built sites look the same. This is because the agent has to
guess what "good" means every time. This project writes it down instead,
so the agent stops guessing.

## Run it

```bash
npm install
npm run dev
```

Open the address it prints. Usually <http://localhost:3000>.

## What is in the box

### A written-down style

`DESIGN.md` says exactly what things should look like. Colours, text
sizes, spacing, corners, how fast things move.

It was not made up. Someone took eight screenshots of a designer's work
and measured the pixels. The numbers in the file come from those
measurements.

It also has a list of ten steps for making an existing project look this
way. They are in order. The first three matter most.

### 89 design resources

Articles, tools and libraries worth knowing about. Sorted into three
piles:

- **Installed** — 9 things already set up and running
- **Applied** — 59 things with their own page, showing what they teach
- **Reference** — 11 links, nothing to install

Another 49 were thrown out. Job ads, people to follow, and essays about
what a design engineer is. Nothing to build with.

### A page per resource

Go to the home page and click any row. Each page has:

1. **The idea**, in one or two sentences
2. **A Before / After switch**

Press **After**. The same thing on screen turns into the better version.
Press **Before** to put it back. You can use both.

You should be able to see it got better without reading anything.

### 28 skills for the agent

The `skills/` folder holds guides written by well-known designers,
copied in word for word. Not summarised. When the agent needs to know
how to do something, it reads the real thing.

### Tools that check the work

Five of them are installed and run for real:

| Command | What it does |
| --- | --- |
| `npm run taste` | Checks the project still matches `DESIGN.md` |
| `npm run taste:calibrate` | Checks the checker itself is not broken |
| `npm run analysis` | Runs two code checkers, saves what they found |
| `npm run check` | Biome |
| `npm run doctor` | react-doctor |

`taste:calibrate` is the useful one. It points the checks at the
original screenshots. If the checker fails those, the checker is wrong,
not the project. That caught three bugs in the checker on the first run.

## Using it for a real project

1. `npm install && npm run dev`
2. Read `DESIGN.md`. Change the colours and text to suit your product.
3. Delete `src/app/page.tsx` and `src/app/applied` and build your thing.
4. Run `npm run taste` as you go.

The agent should read `AGENTS.md` first. It says what is true about
this project and where to look for what.

## What it is built with

Next.js 16, React 19, Tailwind CSS v4, shadcn/ui, Motion.

## Honest list of what is not done

- 7 of the 66 resource pages are still in the old format
- `npm run lint` reports about 26 problems, mostly in pages an agent
  wrote. The site builds and runs
- Some wording on the pages is still too clever. It needs one more pass
- A few pages say "TODO" where the idea should be

## Where it came from

The resources come from [desengs.com](https://desengs.com/) and a saved
links file.

The look comes from [Louis Nguyen's work](https://dribbble.com/louisdainguyen).
His screenshots are not in this repo — they are his. What was measured
out of them is in `design-reference/README.md`.

The skills belong to the people who wrote them and keep their MIT
licences. See `skills/_upstream/`.
