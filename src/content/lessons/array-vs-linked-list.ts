import type { Lesson } from "@/types/lesson";

export const arrayVsLinkedListLesson: Lesson = {
  slug: "array-vs-linked-list",
  title: "Array vs Linked List",
  subject: "Data Structures",
  subjectSlug: "data-structures",
  level: "intro",
  order: 1,
  summary:
    "See contiguous array cells beside pointer-linked nodes — and why random access cost differs.",
  prerequisites: [],
  steps: [
    {
      id: "array-shape",
      title: "Contiguous cells",
      caption:
        "An array stores elements in adjacent memory slots. Index 0, 1, 2 sit next to each other.",
      durationMs: 4500,
      visual: {
        component: "StructuresScene",
        props: {
          mode: "array",
          arrayValues: ["A", "B", "C", "D"],
          listValues: ["A", "B", "C", "D"],
          highlightIndex: null,
          annotation: "Array = contiguous slots",
        },
      },
      callouts: [
        {
          label: "Layout",
          text: "Address of index i is base + i × element_size.",
        },
      ],
    },
    {
      id: "array-index",
      title: "Jump to an index",
      caption:
        "Highlight index 2 (C). The CPU computes the address directly — no walking from the start.",
      durationMs: 5000,
      visual: {
        component: "StructuresScene",
        props: {
          mode: "array",
          arrayValues: ["A", "B", "C", "D"],
          listValues: ["A", "B", "C", "D"],
          highlightIndex: 2,
          annotation: "array[2] → O(1)",
        },
      },
    },
    {
      id: "list-shape",
      title: "Nodes and next",
      caption:
        "A singly linked list stores values in separate nodes. Each node points to the next — there is no index arithmetic.",
      durationMs: 5000,
      visual: {
        component: "StructuresScene",
        props: {
          mode: "list",
          arrayValues: ["A", "B", "C", "D"],
          listValues: ["A", "B", "C", "D"],
          highlightNodeId: "n-0",
          annotation: "List = nodes + next edges",
        },
      },
      callouts: [
        {
          label: "Head",
          text: "Traversal always begins at the head (n-0).",
        },
      ],
    },
    {
      id: "list-walk",
      title: "Walk to the k-th node",
      caption:
        "To reach C you follow A→B→C. Cost grows with k — unlike array indexing.",
      durationMs: 5500,
      visual: {
        component: "StructuresScene",
        props: {
          mode: "list",
          arrayValues: ["A", "B", "C", "D"],
          listValues: ["A", "B", "C", "D"],
          highlightNodeId: "n-2",
          annotation: "k-th access → O(k)",
        },
      },
    },
    {
      id: "compare",
      title: "Same data, different access",
      caption:
        "Same logical sequence A B C D. Array jumps to index 2; the list must chase pointers to the same value.",
      durationMs: 6000,
      visual: {
        component: "StructuresScene",
        props: {
          mode: "compare-access",
          arrayValues: ["A", "B", "C", "D"],
          listValues: ["A", "B", "C", "D"],
          highlightIndex: 2,
          highlightNodeId: "n-2",
          annotation: "Same C — different work",
        },
      },
      callouts: [
        {
          label: "Tradeoff",
          text: "Arrays win random reads; lists win cheap insert/delete at a known node.",
        },
      ],
    },
    {
      id: "list-insert-anim",
      title: "Insert with cause → result",
      caption:
        "Watch insertion as a timeline: highlight B, insert C, relink pointers, settle to A→B→C→D. Use the in-scene play/step/speed controls.",
      durationMs: 12000,
      visual: {
        component: "StructuresScene",
        props: {
          mode: "animate-insert",
          arrayValues: ["A", "B", "C", "D"],
          listValues: ["A", "B", "D"],
          annotation: "Animation primitives drive the viz events",
        },
      },
      callouts: [
        {
          label: "Engine",
          text: "insertAfterBeat → disconnect/connect → replace layout",
        },
      ],
    },
  ],
};
