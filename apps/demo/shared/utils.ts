import type { VizelMentionItem } from "@vizel/core";

/**
 * Mock upload function that simulates server upload.
 * Converts file to base64 for demo purposes.
 */
export async function mockUploadImage(file: File): Promise<string> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Convert to base64 for demo purposes
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Mock users for @mention demo.
 */
const MOCK_USERS: VizelMentionItem[] = [
  { id: "alice", label: "Alice Chen", description: "Product Manager" },
  { id: "bob", label: "Bob Smith", description: "Engineer" },
  { id: "carol", label: "Carol Wang", description: "Designer" },
  { id: "dave", label: "Dave Kim", description: "DevOps" },
  { id: "eve", label: "Eve Martinez", description: "QA Lead" },
];

/**
 * Mock mention items function that filters users by query.
 */
export function mockMentionItems(query: string): VizelMentionItem[] {
  return MOCK_USERS.filter((u) => u.label.toLowerCase().includes(query.toLowerCase()));
}
