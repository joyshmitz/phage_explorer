import { expect, test, describe } from "bun:test";
import { levenshteinDistance } from "./edit-distance";

describe("Levenshtein Distance", () => {
  test("calculates distance correctly", () => {
    expect(levenshteinDistance("kitten", "sitting").distance).toBe(3);
    expect(levenshteinDistance("flaw", "lawn").distance).toBe(2);
    expect(levenshteinDistance("", "abc").distance).toBe(3);
    expect(levenshteinDistance("abc", "").distance).toBe(3);
  });

  test("handles identical strings", () => {
    expect(levenshteinDistance("hello", "hello").distance).toBe(0);
  });
  
  test("handles long strings (likely Rust path)", () => {
      const a = "A".repeat(1000) + "C";
      const b = "A".repeat(1000) + "G";
      expect(levenshteinDistance(a, b).distance).toBe(1);
  });
});
