import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ExpenseService } from '../../core/services/expense.service';
import { ChartConfiguration, ChartType } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { ViewChild, ElementRef } from '@angular/core';
import { User } from '@angular/fire/auth';
import { doc, getDoc } from '@angular/fire/firestore';
import { Firestore } from '@angular/fire/firestore';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,       
    ReactiveFormsModule, 
    DatePipe,
    NgChartsModule,
    FaIconComponent           
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
   isNavbarOpen = false;
 
  @ViewChild('analyticsSection') analyticsSection!: ElementRef;
  @ViewChild('addExpenseSection') addExpenseSection!: ElementRef;
  @ViewChild('yourExpensesSection') yourExpensesSection!: ElementRef;

  expenseForm!: FormGroup;
  expenses: any[] = [];
  categories = ['Food', 'Transport', 'Entertainment', 'Others'];
  userId!: string;
  
  total = 0;
  weeklyTotal = 0;
  monthlyTotal = 0;

  showModal = false;
currentExpense: any = null;
editForm!: FormGroup;

showProfileModal = false;
  userProfile: any = null;
  registrationDate: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private expenseService: ExpenseService,
     private firestore: Firestore
  ) {}

  toggleNavbar() {
  this.isNavbarOpen = !this.isNavbarOpen;
}

 loadUserProfile(): void {
    this.authService.getCurrentUser().subscribe(async (user: User | null) => {
      if (user) {
        const userDoc = await getDoc(doc(this.firestore, 'users', user.uid));
        
        this.userProfile = {
          name: userDoc.exists() ? userDoc.data()['name'] : 'Not set',
          email: user.email,
          registrationDate: user.metadata.creationTime
        };
        
        if (user.metadata.creationTime) {
          this.registrationDate = new Date(user.metadata.creationTime).toLocaleDateString();
        }
      }
    });
  }

  toggleProfileModal(): void {
    this.showProfileModal = !this.showProfileModal;
    if (this.showProfileModal) {
      this.loadUserProfile();
    }
  }


   navigateTo(section: string): void {
    setTimeout(() => {
      const element = this.getSectionElement(section);
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    });
  }

  private getSectionElement(section: string): HTMLElement | null {
    switch(section) {
      case 'analytics': 
        return this.analyticsSection?.nativeElement;
      case 'addExpense':
        return this.addExpenseSection?.nativeElement;
      case 'yourExpenses':
        return this.yourExpensesSection?.nativeElement;
      case 'home':
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return null;
      default:
        return null;
    }
  }


  ngOnInit(): void {
    this.initForm();
    this.initEditForm();
    this.loadUserData();
  }
  initEditForm(): void {
    this.editForm = this.fb.group({
      name: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      category: ['', Validators.required],
      date: ['', Validators.required]
    });
  }
  
  openEditModal(expense: any): void {
    this.currentExpense = expense;
    this.editForm.patchValue({
      name: expense.name,
      amount: expense.amount,
      category: expense.category,
      date: new Date(expense.date).toISOString().split('T')[0]
    });
    this.showModal = true;
  }
  
  closeModal(): void {
    this.showModal = false;
    this.currentExpense = null;
  }
  
  onEditSubmit(): void {
    if (this.editForm.valid && this.currentExpense) {
      const updatedExpense = {
        ...this.currentExpense,
        ...this.editForm.value,
        date: new Date(this.editForm.value.date).toISOString()
      };
      
      this.expenseService.updateExpense(updatedExpense.id, updatedExpense)
        .then(() => {
          this.closeModal();
          this.loadExpenses();
        });
    }
  }

  initForm(): void {
    this.expenseForm = this.fb.group({
      name: ['', Validators.required], // Add this line
      amount: [null, [Validators.required, Validators.min(1)]],
      category: ['', Validators.required],
      date: [new Date().toISOString().split('T')[0], Validators.required]
    });
  }

  loadUserData(): void {
    this.authService.getCurrentUser().subscribe((user: any) => {
      if (user) {
        this.userId = user.uid;
        this.loadExpenses();
      }
    });
  }

  loadExpenses(): void {
    this.expenseService.getExpenses(this.userId).subscribe((data: any[]) => {
      this.expenses = data;
      this.calculateTotals(data);
      if (data.length > 0) {
        this.updateChart(data);
      }
    });
  }

  calculateTotals(expenses: any[]): void {
    this.total = expenses.reduce((sum, e) => sum + e.amount, 0);
    
    const now = new Date()
    this.weeklyTotal = expenses
      .filter(e => this.isThisWeek(new Date(e.date)))
      .reduce((sum, e) => sum + e.amount, 0);
      
    this.monthlyTotal = expenses
      .filter(e => new Date(e.date).getMonth() === now.getMonth())
      .reduce((sum, e) => sum + e.amount, 0);
  }

  onAdd(): void {
    if (this.expenseForm.valid) {
      const expense = { 
        ...this.expenseForm.value, 
        userId: this.userId,
        date: new Date(this.expenseForm.value.date).toISOString()
      };
      
      this.expenseService.addExpense(expense).then(() => {
        this.expenseForm.reset({
          date: new Date().toISOString().split('T')[0]
        });
      });
    }
  }

  onDelete(id: string): void {
    this.expenseService.deleteExpense(id).then(() => {
      this.loadExpenses();
    });
  }
  

  logout(): void {
    this.authService.logout();
  }

  isThisWeek(date: Date): boolean {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    return date >= startOfWeek && date < endOfWeek;
  }
  
  public chartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
    }]
  };
  public chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { display: true }
    }
  };
  
  public chartType: ChartType = 'pie'; 
  public barChartType: ChartType = 'bar';

  public barChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
    }]
  };
  

public barChartOptions: ChartConfiguration['options'] = {
  responsive: true,
  plugins: {
    legend: { display: false }
  }
};
  
  private updateChart(expenses: any[]): void {
    const categoryTotals = new Map<string, number>();
    
    expenses.forEach(expense => {
      const current = categoryTotals.get(expense.category) || 0;
      categoryTotals.set(expense.category, current + expense.amount);
    });
  
    this.chartData = {
      ...this.chartData,
      labels: Array.from(categoryTotals.keys()),
      datasets: [{
        ...this.chartData.datasets[0],
        data: Array.from(categoryTotals.values())
      }]
    };
  
    this.barChartData = {
      ...this.barChartData,
      labels: Array.from(categoryTotals.keys()),
      datasets: [{
        data: Array.from(categoryTotals.values()),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
      }]
    };
    
  }
}  