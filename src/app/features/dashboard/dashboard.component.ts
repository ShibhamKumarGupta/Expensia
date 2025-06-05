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
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,        // For *ngFor and date pipe
    ReactiveFormsModule, // For formGroup
    DatePipe,
    NgChartsModule,
    FaIconComponent,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  expenseDate: Date = new Date();
   isNavbarOpen = false;
  // Add these ViewChild references
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

  profilePictureUrl: string | null = null;
  isUploading = false;
  uploadProgress = 0;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  uploadError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private expenseService: ExpenseService,
     private firestore: Firestore
  ) {}

  toggleNavbar() {
  this.isNavbarOpen = !this.isNavbarOpen;
}

async onFileSelected(event: any): Promise<void> {
  const file: File = event.target.files[0];
  if (!file) return;

  this.isUploading = true;
  this.uploadProgress = 0;
  this.uploadError = null;
  this.selectedFile = file;

  // Create preview
  const reader = new FileReader();
  reader.onload = (e: any) => {
    this.previewUrl = e.target.result;
  };
  reader.readAsDataURL(file);

  // Simulate upload progress
  const interval = setInterval(() => {
    this.uploadProgress += 10;
    if (this.uploadProgress >= 100) {
      clearInterval(interval);
      this.isUploading = false;
    }
  }, 200);
}

async uploadProfilePicture(): Promise<void> {
  if (!this.selectedFile || !this.userId) return;

  // Reset states
  this.uploadError = null;
  this.isUploading = true;
  this.uploadProgress = 0;

  try {
    // File size validation (example: 500KB max)
    if (this.selectedFile.size > 500 * 1024) {
      throw new Error('Image size should be less than 500KB');
    }

    // Step 1: Read file (25% progress)
    const base64Image = await this.readFileWithProgress();
    
    // Step 2: Upload to Firestore (25% to 100% progress)
    await this.uploadToFirestore(base64Image);
    
    // Complete
    this.uploadProgress = 100;
    await this.loadUserProfile();
    
  } catch (error) {
    this.uploadError = error instanceof Error ? error.message : 'Upload failed';
    console.error('Upload error:', error);
  } finally {
    this.isUploading = false;
  }
}

private async readFileWithProgress(): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    // Update progress during file read
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        this.uploadProgress = Math.min(25, (event.loaded / event.total) * 25);
      }
    };
    
    reader.onload = (e: any) => {
      this.uploadProgress = 25; // Ensure we reach 25% when done
      resolve(e.target.result.split(',')[1]);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };
    
    reader.readAsDataURL(this.selectedFile as File);
  });
}

private async uploadToFirestore(imageData: string): Promise<void> {
  // Simulate progressive upload (in real app, you might have actual chunks)
  const steps = 10;
  const stepProgress = 75 / steps; // Remaining 75% over 10 steps
    
  for (let i = 1; i <= steps; i++) {
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    this.uploadProgress = 25 + (i * stepProgress);
  }
  
  // Actual Firestore update
  await this.authService.updateProfilePicture(this.userId, imageData);
  this.uploadProgress = 100;
}

async deleteProfilePicture(): Promise<void> {
  if (!this.userId) return;

  try {
    await this.authService.deleteProfilePicture(this.userId);
    this.previewUrl = null;
    this.selectedFile = null;
    this.loadUserProfile();
  } catch (error) {
    console.error('Delete error:', error);
  }
}


  // Add this method to load user profile data
  loadUserProfile(): void {
  this.authService.getCurrentUser().subscribe(async (user: User | null) => {
    if (user) {
      // Get user document from Firestore
      const userDoc = await getDoc(doc(this.firestore, 'users', user.uid));
      
      this.userProfile = {
        name: userDoc.exists() ? userDoc.data()['name'] : 'Not set',
        email: user.email,
        registrationDate: user.metadata.creationTime,
        profilePicture: userDoc.exists() ? userDoc.data()['profilePicture'] : null
      };
      
      // Format registration date
      if (user.metadata.creationTime) {
        this.registrationDate = new Date(user.metadata.creationTime).toLocaleDateString();
      }
      
      // Set preview if profile picture exists
      if (this.userProfile.profilePicture) {
        this.previewUrl = `data:image/jpeg;base64,${this.userProfile.profilePicture}`;
      }
    }
  });
}

  // Add this method to toggle profile modal
  toggleProfileModal(): void {
    this.showProfileModal = !this.showProfileModal;
    if (this.showProfileModal) {
      this.loadUserProfile();
    }
  }


   navigateTo(section: string): void {
   this.isNavbarOpen = false;
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
      date: [new Date(), Validators.required] 
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
      name: ['', Validators.required], 
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
    // Sort expenses by date in descending order (newest first)
    this.expenses = data.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
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