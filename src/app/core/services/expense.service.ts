import { Injectable, NgZone, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  updateDoc  // Add this import
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Expense } from '../models/expense.model';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private firestore = inject(Firestore);

  constructor(private zone: NgZone) {}

  addExpense(expense: Expense) {
    const expensesRef = collection(this.firestore, 'expenses');
    return addDoc(expensesRef, expense);
  }

  getExpenses(userId: string): Observable<Expense[]> {
    const expensesRef = collection(this.firestore, 'expenses');
    const q = query(expensesRef, where('userId', '==', userId));

    return this.zone.run(() =>
      collectionData(q, { idField: 'id' }) as Observable<Expense[]>
    );
  }

  deleteExpense(id: string) {
    const docRef = doc(this.firestore, 'expenses', id);
    return deleteDoc(docRef);
  }

  // Updated method using the new modular API
  updateExpense(id: string, expense: Partial<Expense>): Promise<void> {
    const docRef = doc(this.firestore, 'expenses', id);
    return updateDoc(docRef, expense);
  }
}