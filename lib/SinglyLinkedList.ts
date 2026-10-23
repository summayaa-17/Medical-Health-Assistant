export interface SymptomRecord {
  id: string;
  symptom: string;
  healthTip: string;
  createdAt: number;
}

/**
 * Node — each element in the singly linked list.
 * Holds one symptom record and a pointer to the next node (or null).
 */
export class ListNode {
  data: SymptomRecord;
  next: ListNode | null;

  constructor(data: SymptomRecord) {
    this.data = data;
    this.next = null;
  }
}

/**
 * SinglyLinkedList — a genuine singly linked list data structure.
 *
 * Each node points only forward (head → ... → null). The list does NOT
 * wrap an array; traversal walks node-by-node via the `next` pointers.
 *
 * Time complexity:
 *   append     O(n)  — walk to the tail before linking the new node
 *   search     O(n)  — walk every node comparing the symptom name
 *   deleteById O(n)  — walk to the target node, re-link the previous node
 *   traverse   O(n)  — visit every node once
 *   size       O(1)  — maintained as a running counter
 */
export class SinglyLinkedList {
  head: ListNode | null;
  private _count: number;

  constructor() {
    this.head = null;
    this._count = 0;
  }

  /** Add a record to the end of the list. O(n) */
  append(data: SymptomRecord): void {
    const newNode = new ListNode(data);
    if (this.head === null) {
      this.head = newNode;
    } else {
      let current = this.head;
      while (current.next !== null) {
        current = current.next;
      }
      current.next = newNode;
    }
    this._count++;
  }

  /**
   * Return every record whose symptom name contains `query`
   * (case-insensitive). O(n)
   */
  search(query: string): SymptomRecord[] {
    const results: SymptomRecord[] = [];
    const q = query.trim().toLowerCase();
    if (q === '') return [];
    let current = this.head;
    while (current !== null) {
      if (current.data.symptom.toLowerCase().includes(q)) {
        results.push(current.data);
      }
      current = current.next;
    }
    return results;
  }

  /**
   * Remove the node whose id matches. Handles deleting the head,
   * the only node, a middle node, or a non-existent id. O(n)
   */
  deleteById(id: string): boolean {
    if (this.head === null) return false;

    if (this.head.data.id === id) {
      this.head = this.head.next;
      this._count--;
      return true;
    }

    let current = this.head;
    while (current.next !== null) {
      if (current.next.data.id === id) {
        current.next = current.next.next;
        this._count--;
        return true;
      }
      current = current.next;
    }
    return false;
  }

  /** Return all records as an array (for rendering). O(n) */
  traverse(): SymptomRecord[] {
    const records: SymptomRecord[] = [];
    let current = this.head;
    while (current !== null) {
      records.push(current.data);
      current = current.next;
    }
    return records;
  }

  size(): number {
    return this._count;
  }

  isEmpty(): boolean {
    return this.head === null;
  }

  clear(): void {
    this.head = null;
    this._count = 0;
  }

  /** Rebuild the list from a plain array (used after loading localStorage). */
  fromArray(records: SymptomRecord[]): void {
    this.clear();
    for (const record of records) {
      this.append(record);
    }
  }
}
