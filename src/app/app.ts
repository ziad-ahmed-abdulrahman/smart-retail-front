import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './services/auth.service';
import { StoreService } from './services/store.service';
import { CategoryService } from './services/category.service';
import { ProductService } from './services/product.service';
import { DeviceService, Device } from './services/device.service';
import { UserProfile, Store, Category, Product } from './models/app.models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  isLoggedIn = false;
  authView: 'login' | 'register' | 'activate' | 'forgot' = 'login';

  // Navigation: Dashboard vs Inside Store
  currentTab: 'dashboard' | 'stores' | 'products' | 'map' | 'categories' | 'devices' | 'profile' = 'dashboard';

  // Devices context
  showDeviceModal = false;
  deviceFormData = {
    name: '',
    deviceCode: '',
    type: 'SmartCamera',
    isOnline: true
  };
  deviceTypes = [
    { value: 'SmartCamera', label: 'كاميرات الرؤية الحاسوبية' },
    { value: 'PosTerminal', label: 'نقاط دفع ذاتي' }
  ];

  luxuryCategoryColors = [
    '#2C4C5E', // Slate Teal (Dairy)
    '#7D332C', // Terracotta (Meats)
    '#32573E', // Sage Forest (Produce)
    '#805928', // Warm Amber (Bakery)
    '#4A3654', // Muted Royal Plum (Beverages)
    '#275252', // Dusty Slate Cyan (Detergents)
    '#5C2D44', // Berry Wine (Dry Grocery)
    '#3D5066'  // Steel Slate
  ];

  perimeterSlots = [
    { x: 22, y: 16 }, // Top Left (e.g. Dairy)
    { x: 50, y: 16 }, // Top Center (e.g. Meat)
    { x: 78, y: 16 }, // Top Right (e.g. Produce)
    { x: 22, y: 48 }, // Center Left (e.g. Bakery)
    { x: 78, y: 48 }, // Center Right (e.g. Beverages)
    { x: 22, y: 78 }, // Bottom Left (e.g. Cleaning)
    { x: 78, y: 78 }, // Bottom Right (e.g. Dry Groceries)
    { x: 50, y: 48 }  // Center Core
  ];

  // Map category products list
  categoryMapProducts: Product[] = [];
  selectedMapFilterSubCategoryId: number | null = null;
  isLoadingMapProductsList = false;

  // Stores context
  stores: Store[] = [];
  selectedStore: Store | null = null;
  isLoadingStores = false;

  // Alerts
  alertMessage = '';
  alertType: 'success' | 'danger' | 'info' = 'info';

  // Auth Forms
  loginEmail = '';
  loginPassword = '';
  regFullName = '';
  regStoreName = '';
  regEmail = '';
  regPassword = '';
  actEmail = '';
  actCode = '';
  forgotEmail = '';
  forgotCode = '';
  forgotNewPassword = '';

  // Get dynamic merchant display name
  get merchantDisplayName(): string {
    if (this.profile) {
      const full = `${this.profile.firstName || ''} ${this.profile.lastName || ''}`.trim();
      if (full) return full;
      if (this.profile.userName) return this.profile.userName;
      if (this.profile.email) return this.profile.email;
    }
    return '';
  }

  get merchantInitial(): string {
    const name = this.merchantDisplayName || this.profile?.email || '';
    return name && name.length > 0 ? name.charAt(0).toUpperCase() : '';
  }

  // Profile
  profile: UserProfile | null = null;
  profileSubView: 'overview' | 'edit' | 'change-password' | 'forgot-password' = 'overview';
  editProfileData: any = {
    firstName: '',
    lastName: '',
    phoneNumber: '',
    address: { street: '', city: '', state: '', zipCode: '', country: '', government: '' }
  };

  // Change Password with OTP in Profile
  changePasswordCode = '';
  changePasswordOld = '';
  changePasswordNew = '';
  changePasswordConfirm = '';
  isSendingChangePasswordCode = false;
  isVerifyingChangePassword = false;
  changePasswordCodeSent = false;

  // Forgot / Reset Password with OTP in Profile
  profileResetCode = '';
  profileResetNew = '';
  profileResetConfirm = '';
  isSendingProfileResetCode = false;
  isVerifyingProfileReset = false;
  profileResetCodeSent = false;

  // Change Password in Profile (direct fallback)
  currentPassword = '';
  newPassword = '';
  confirmNewPassword = '';
  isChangingPassword = false;

  // Store Modal
  showStoreModal = false;
  storeFormMode: 'create' | 'edit' = 'create';
  storeFormData = { id: 0, name: '', address: '', city: '', isActive: true };

  // Categories & Map
  categories: Category[] = [];
  selectedCategoryForMap: Category | null = null;
  selectedSubCategoryForMap: Category | null = null;
  isLoadingCategories = false;
  expandedCategoryIds = new Set<number>();

  toggleCategoryAccordion(catId: number, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    if (this.expandedCategoryIds.has(catId)) {
      this.expandedCategoryIds.delete(catId);
    } else {
      this.expandedCategoryIds.add(catId);
    }
    this.cdr.detectChanges();
  }

  isCategoryExpanded(catId: number): boolean {
    return this.expandedCategoryIds.has(catId);
  }

  // Drag and Drop & Interactive Map coordinates
  entrancePosition = { x: 50, y: 88 }; // percentage % on canvas
  draggingItem: { type: 'beacon' | 'category' | 'subcategory'; id?: number; offsetX: number; offsetY: number } | null = null;
  categoryPositions: { [id: number]: { x: number; y: number } } = {};

  // Category Modal
  showCategoryModal = false;
  categoryFormMode: 'create' | 'edit' = 'create';
  categoryFormData = {
    id: 0,
    name: '',
    description: '',
    parentCategoryId: null as number | null,
    gridX: 0,
    gridY: 0,
    width: 1,
    height: 1,
    colorHex: '#B08D57',
    isVisible: true
  };

  // Category Products Modal (Interactive View for Map & Table)
  showCategoryProductsModal = false;
  modalCategory: Category | null = null;
  modalProducts: Product[] = [];
  isLoadingModalProducts = false;
  dragMoved = false;

  // Delete Category Modal
  showDeleteCatModal = false;
  deletingCategory: Category | null = null;
  deleteProductsChoice = false;

  // Products
  products: Product[] = [];
  isLoadingProducts = false;
  productSearchBarcode = '';
  productFilterCategory: number | null = null;

  // Product Modal
  showProductModal = false;
  productFormMode: 'create' | 'edit' = 'create';
  productFormData = {
    id: 0,
    name: '',
    description: '',
    barcode: '',
    price: 0,
    stock: 0,
    categoryId: null as number | null,
    isVisible: true
  };

  devices: Device[] = [];
  isLoadingDevices = false;
  isSavingMapLayout = false;

  constructor(
    private authService: AuthService,
    private storeService: StoreService,
    private categoryService: CategoryService,
    private productService: ProductService,
    private deviceService: DeviceService,
    private cdr: ChangeDetectorRef,
    private location: Location
  ) { }

  ngOnInit() {
    // 1. Sync URL hash with browser navigation (Back / Forward buttons)
    this.initHistoryRouting();

    const token = this.authService.getToken();
    if (token) {
      this.isLoggedIn = true;
      this.loadProfile();
      this.loadStores();
    }
  }

  private initHistoryRouting() {
    const hash = window.location.hash.replace('#', '');
    if (hash && ['dashboard', 'stores', 'products', 'map', 'categories', 'devices', 'profile'].includes(hash)) {
      this.currentTab = hash as any;
    }

    // Listen to popstate (Browser Back / Forward buttons)
    window.addEventListener('popstate', () => {
      const currentHash = window.location.hash.replace('#', '') || 'dashboard';
      if (['dashboard', 'stores', 'products', 'map', 'categories', 'devices', 'profile'].includes(currentHash)) {
        this.currentTab = currentHash as any;
        this.cdr.detectChanges();
      }
    });
  }

  setTab(tab: 'dashboard' | 'stores' | 'products' | 'map' | 'categories' | 'devices' | 'profile') {
    this.currentTab = tab;
    if (tab === 'devices') {
      this.loadDevices();
    }
    // Push state so back button works without page reload
    window.history.pushState(null, '', `#${tab}`);
    this.cdr.detectChanges();
  }

  toArabicDigits(val: number | string | undefined | null): string {
    if (val === undefined || val === null || val === '') return '٠';
    return String(val).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[+d]);
  }

  get allCategoriesFlat(): { id: number; name: string; isSub: boolean }[] {
    const list: { id: number; name: string; isSub: boolean }[] = [];
    for (const c of this.categories) {
      list.push({ id: c.id, name: c.name, isSub: false });
      if (c.subCategories?.length) {
        for (const s of c.subCategories) {
          list.push({ id: s.id, name: s.name, isSub: true });
        }
      }
    }
    return list;
  }

  showAlert(msg: string, type: 'success' | 'danger' | 'info' = 'info') {
    this.alertMessage = msg;
    this.alertType = type;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.alertMessage = '';
      this.cdr.detectChanges();
    }, 4000);
  }

  // --- Auth Handlers ---
  handleLogin() {
    if (!this.loginEmail || !this.loginPassword) {
      this.showAlert('اكتب البريد الإلكتروني وكلمة المرور.', 'danger');
      return;
    }
    this.authService.login({ email: this.loginEmail.trim(), password: this.loginPassword }).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          this.isLoggedIn = true;
          this.showAlert('أهلاً بك مجدداً! تم تسجيل الدخول بنجاح.', 'success');
          this.loadProfile();
          this.loadStores();
        }
      },
      error: (err) => {
        const msg = err.error?.message || 'تعذر تسجيل الدخول. تحقق من بياناتك.';
        if (msg.includes('deactivated') || msg.includes('activate') || msg.includes('تفعيل')) {
          this.showAlert('الحساب غير مفعّل بعد. يرجى إدخال رمز التحقق لتفعيل الحساب.', 'info');
          this.actEmail = this.loginEmail.trim();
          this.authView = 'activate';
        } else {
          this.showAlert(msg, 'danger');
        }
      }
    });
  }

  handleRegister() {
    if (!this.regFullName || !this.regFullName.trim()) {
      this.showAlert('يرجى كتابة اسم التاجر أو المالك.', 'danger');
      return;
    }
    if (!this.regEmail || !this.regPassword) {
      this.showAlert('اكتب البريد الإلكتروني وكلمة المرور.', 'danger');
      return;
    }
    this.authService.register({
      email: this.regEmail.trim(),
      password: this.regPassword,
      fullName: this.regFullName.trim()
    }).subscribe({
      next: (res) => {
        this.showAlert(res.message || 'تم إنشاء الحساب بنجاح! تم إرسال كود التفعيل المكون من 6 أرقام إلى بريدك الإلكتروني.', 'success');
        this.actEmail = this.regEmail.trim();
        this.actCode = '';
        this.authView = 'activate';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.showAlert(err.error?.message || 'تعذر إنشاء الحساب. تأكد من استيفاء شروط كلمة المرور.', 'danger');
        this.cdr.detectChanges();
      }
    });
  }

  handleVerifyActivation() {
    if (!this.actEmail || !this.actCode) {
      this.showAlert('اكتب البريد وكود التفعيل.', 'danger');
      return;
    }
    this.authService.verifyActivation(this.actEmail, this.actCode).subscribe({
      next: () => {
        this.showAlert('تم تفعيل الحساب بنجاح! يمكنك الآن تسجيل الدخول.', 'success');
        this.loginEmail = this.actEmail;
        this.authView = 'login';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.showAlert(err.error?.message || 'كود التفعيل غير صحيح أو انتهى.', 'danger');
        this.cdr.detectChanges();
      }
    });
  }

  handleResendActivationCode() {
    if (!this.actEmail) {
      this.showAlert('يرجى كتابة البريد الإلكتروني.', 'danger');
      return;
    }
    this.authService.sendActivation(this.actEmail).subscribe({
      next: (res) => {
        this.showAlert(res.message || 'تم إرسال كود تفعيل جديد إلى بريدك الإلكتروني.', 'success');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.showAlert(err.error?.message || 'تعذر إرسال كود التفعيل.', 'danger');
        this.cdr.detectChanges();
      }
    });
  }

  handleSendReset() {
    if (!this.forgotEmail) {
      this.showAlert('اكتب البريد الإلكتروني.', 'danger');
      return;
    }
    this.authService.sendResetCode(this.forgotEmail).subscribe({
      next: () => this.showAlert('تم إرسال كود استرجاع كلمة المرور إلى بريدك.', 'info'),
      error: (err) => this.showAlert(err.error?.message || 'تعذر إرسال الكود.', 'danger')
    });
  }

  handleVerifyReset() {
    if (!this.forgotEmail || !this.forgotCode || !this.forgotNewPassword) {
      this.showAlert('يرجى ملء جميع الحقول.', 'danger');
      return;
    }
    this.authService.verifyResetCode({
      email: this.forgotEmail,
      code: this.forgotCode,
      newPassword: this.forgotNewPassword
    }).subscribe({
      next: () => {
        this.showAlert('تم تحديث كلمة المرور بنجاح! سجل الدخول بكلمتك الجديدة.', 'success');
        this.loginEmail = this.forgotEmail;
        this.authView = 'login';
      },
      error: (err) => this.showAlert(err.error?.message || 'الكود غير صحيح.', 'danger')
    });
  }

  logout() {
    this.authService.logout();
    this.isLoggedIn = false;
    this.profile = null;
    this.stores = [];
    this.selectedStore = null;
    this.categories = [];
    this.products = [];
    this.currentTab = 'dashboard';
    this.authView = 'login';
    this.showAlert('تم تسجيل الخروج بنجاح.', 'info');
  }

  // Egyptian Governorates & Arabic Localization
  egyptianGovernorates: string[] = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'الشرقية', 'الدقهلية', 'القليوبية',
    'الغربية', 'المنوفية', 'البحيرة', 'كفر الشيخ', 'دمياط', 'بورسعيد',
    'الإسماعيلية', 'السويس', 'شمال سيناء', 'جنوب سيناء', 'بني سويف',
    'الفيوم', 'المنيا', 'أسيوط', 'سوهاج', 'قنا', 'الأقصر', 'أسوان',
    'البحر الأحمر', 'الوادي الجديد', 'مطروح'
  ];

  translateToArabic(val: string | undefined | null): string {
    if (!val) return '';
    const map: Record<string, string> = {
      'Egypt': 'مصر',
      'Cairo': 'القاهرة',
      'Alexandria': 'الإسكندرية',
      'Giza': 'الجيزة',
      'Mansoura': 'المنصورة',
      'Zagazig': 'الزقازيق',
      'Tanta': 'طنطا'
    };
    return map[val.trim()] || val;
  }

  onZipCodeInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input) {
      this.editProfileData.address.zipCode = this.toArabicDigits(input.value);
    }
  }

  onPhoneInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input) {
      this.editProfileData.phoneNumber = this.toArabicDigits(input.value);
    }
  }

  // --- Profile ---
  loadProfile() {
    this.authService.getProfile().subscribe({
      next: (res) => {
        if (res.data) {
          this.profile = res.data;

          const firstName = res.data.firstName || '';
          const lastName = res.data.lastName || '';
          const street = res.data.address?.street || '';
          const city = res.data.address?.city || '';
          const government = res.data.address?.government || '';
          const country = res.data.address?.country || '';
          const rawZip = res.data.address?.zipCode || '';
          const zipCode = rawZip ? this.toArabicDigits(rawZip) : '';
          const rawPhone = res.data.phoneNumber || '';
          const phoneNumber = rawPhone ? this.toArabicDigits(rawPhone) : '';

          this.editProfileData = {
            firstName,
            lastName,
            phoneNumber,
            address: {
              street,
              city,
              state: res.data.address?.state || '',
              zipCode,
              country,
              government
            }
          };

          this.profile.firstName = firstName;
          this.profile.lastName = lastName;
          if (this.profile.address) {
            this.profile.address.street = street;
            this.profile.address.city = city;
            this.profile.address.government = government;
            this.profile.address.country = country;
            this.profile.address.zipCode = zipCode;
          }
          this.cdr.detectChanges();
        }
      }
    });
  }

  setProfileSubView(subView: 'overview' | 'edit' | 'change-password' | 'forgot-password') {
    this.profileSubView = subView;
    if (subView === 'change-password' && !this.changePasswordCodeSent) {
      this.sendChangePasswordOtp();
    } else if (subView === 'forgot-password' && !this.profileResetCodeSent) {
      this.sendProfileResetOtp();
    }
    this.cdr.detectChanges();
  }

  sendChangePasswordOtp() {
    const email = this.profile?.email;
    if (!email) {
      this.showAlert('تعذر العثور على البريد الإلكتروني للحساب.', 'danger');
      return;
    }
    this.isSendingChangePasswordCode = true;
    this.authService.sendChangePasswordCode(email).subscribe({
      next: () => {
        this.isSendingChangePasswordCode = false;
        this.changePasswordCodeSent = true;
        this.showAlert(`تم إرسال رمز التحقق لتغيير كلمة المرور إلى بريدك: ${email}`, 'success');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSendingChangePasswordCode = false;
        this.showAlert(err.error?.message || 'تعذر إرسال رمز التحقق. يرجى المحاولة مرة أخرى.', 'danger');
        this.cdr.detectChanges();
      }
    });
  }

  handleVerifyChangePasswordWithOtp() {
    const email = this.profile?.email;
    if (!email) {
      this.showAlert('تعذر تحديد البريد الإلكتروني.', 'danger');
      return;
    }
    if (!this.changePasswordCode || !this.changePasswordOld || !this.changePasswordNew || !this.changePasswordConfirm) {
      this.showAlert('يرجى ملء جميع الحقول ورمز التحقق.', 'danger');
      return;
    }
    if (this.changePasswordNew.length < 8) {
      this.showAlert('يجب أن تتكون كلمة المرور الجديدة من 8 خانات على الأقل.', 'danger');
      return;
    }
    if (this.changePasswordNew !== this.changePasswordConfirm) {
      this.showAlert('كلمة المرور الجديدة وتأكيدها غير متطابقين.', 'danger');
      return;
    }

    this.isVerifyingChangePassword = true;
    this.authService.verifyChangePasswordCode({
      email,
      code: this.changePasswordCode.trim(),
      oldPassword: this.changePasswordOld,
      newPassword: this.changePasswordNew
    }).subscribe({
      next: () => {
        this.isVerifyingChangePassword = false;
        this.showAlert('تم التحقق وتغيير كلمة المرور بنجاح!', 'success');
        this.changePasswordCode = '';
        this.changePasswordOld = '';
        this.changePasswordNew = '';
        this.changePasswordConfirm = '';
        this.changePasswordCodeSent = false;
        this.profileSubView = 'overview';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isVerifyingChangePassword = false;
        this.showAlert(err.error?.message || 'تعذر تغيير كلمة المرور. تأكد من صحة رمز التحقق وكلمة المرور الحالية.', 'danger');
        this.cdr.detectChanges();
      }
    });
  }

  sendProfileResetOtp() {
    const email = this.profile?.email;
    if (!email) {
      this.showAlert('تعذر العثور على البريد الإلكتروني للحساب.', 'danger');
      return;
    }
    this.isSendingProfileResetCode = true;
    this.authService.sendResetCode(email).subscribe({
      next: () => {
        this.isSendingProfileResetCode = false;
        this.profileResetCodeSent = true;
        this.showAlert(`تم إرسال رمز استعادة كلمة المرور إلى بريدك: ${email}`, 'success');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSendingProfileResetCode = false;
        this.showAlert(err.error?.message || 'تعذر إرسال رمز الاستعادة.', 'danger');
        this.cdr.detectChanges();
      }
    });
  }

  handleVerifyProfileResetWithOtp() {
    const email = this.profile?.email;
    if (!email) {
      this.showAlert('تعذر تحديد البريد الإلكتروني.', 'danger');
      return;
    }
    if (!this.profileResetCode || !this.profileResetNew || !this.profileResetConfirm) {
      this.showAlert('يرجى ملء رمز التحقق وكلمة المرور الجديدة وتأكيدها.', 'danger');
      return;
    }
    if (this.profileResetNew.length < 8) {
      this.showAlert('يجب أن تتكون كلمة المرور الجديدة من 8 خانات على الأقل.', 'danger');
      return;
    }
    if (this.profileResetNew !== this.profileResetConfirm) {
      this.showAlert('كلمة المرور الجديدة وتأكيدها غير متطابقين.', 'danger');
      return;
    }

    this.isVerifyingProfileReset = true;
    this.authService.verifyResetCode({
      email,
      code: this.profileResetCode.trim(),
      newPassword: this.profileResetNew
    }).subscribe({
      next: () => {
        this.isVerifyingProfileReset = false;
        this.showAlert('تم استعادة وتعيين كلمة المرور بنجاح!', 'success');
        this.profileResetCode = '';
        this.profileResetNew = '';
        this.profileResetConfirm = '';
        this.profileResetCodeSent = false;
        this.profileSubView = 'overview';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isVerifyingProfileReset = false;
        this.showAlert(err.error?.message || 'تعذر استعادة كلمة المرور. تأكد من صحة رمز التحقق.', 'danger');
        this.cdr.detectChanges();
      }
    });
  }

  saveProfile() {
    const payload = {
      firstName: this.editProfileData.firstName,
      lastName: this.editProfileData.lastName,
      phoneNumber: this.editProfileData.phoneNumber,
      street: this.editProfileData.address?.street,
      city: this.editProfileData.address?.city,
      state: this.editProfileData.address?.state,
      zipCode: this.editProfileData.address?.zipCode,
      country: this.editProfileData.address?.country,
      government: this.editProfileData.address?.government
    };

    this.authService.updateProfile(payload).subscribe({
      next: () => {
        this.showAlert('تم حفظ تعديلات الملف الشخصي بنجاح.', 'success');
        this.profileSubView = 'overview';
        this.loadProfile();
      },
      error: (err) => this.showAlert(err.error?.message || 'تعذر حفظ البيانات.', 'danger')
    });
  }

  handleChangePassword() {
    if (!this.currentPassword || !this.newPassword || !this.confirmNewPassword) {
      this.showAlert('يرجى ملء جميع حقول كلمة المرور.', 'danger');
      return;
    }
    if (this.newPassword.length < 8) {
      this.showAlert('يجب أن تتكون كلمة المرور الجديدة من 8 خانات على الأقل.', 'danger');
      return;
    }
    if (this.newPassword !== this.confirmNewPassword) {
      this.showAlert('كلمة المرور الجديدة وتأكيدها غير متطابقين.', 'danger');
      return;
    }
    this.isChangingPassword = true;
    this.authService.changePassword({
      currentPassword: this.currentPassword,
      newPassword: this.newPassword
    }).subscribe({
      next: () => {
        this.isChangingPassword = false;
        this.showAlert('تم تغيير كلمة المرور بنجاح!', 'success');
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmNewPassword = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isChangingPassword = false;
        this.showAlert(err.error?.message || 'تعذر تغيير كلمة المرور. تأكد من كلمة المرور الحالية واستيفاء الشروط.', 'danger');
        this.cdr.detectChanges();
      }
    });
  }

  // --- Stores & Branches Management ---
  loadStores(selectStoreId?: number) {
    this.isLoadingStores = true;
    this.storeService.getMyStores().subscribe({
      next: (res) => {
        this.isLoadingStores = false;
        this.stores = res.data || [];
        if (this.stores.length > 0) {
          if (selectStoreId) {
            this.selectedStore = this.stores.find(s => s.id === selectStoreId) || this.stores[0];
          } else if (!this.selectedStore) {
            this.selectedStore = this.stores[0];
          } else {
            this.selectedStore = this.stores.find(s => s.id === this.selectedStore!.id) || this.stores[0];
          }
          this.loadStoreData();
        } else {
          this.selectedStore = null;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingStores = false;
        this.showAlert('تعذر تحميل بيانات الفروع.', 'danger');
        this.cdr.detectChanges();
      }
    });
  }

  onSelectStore(store: Store) {
    this.selectedStore = store;
    this.selectedCategoryForMap = null;
    this.selectedSubCategoryForMap = null;
    this.loadStoreData();
    this.cdr.detectChanges();
  }

  loadStoreData() {
    if (!this.selectedStore) return;
    this.loadCategories();
    this.loadProducts();
    this.loadDevices();
  }

  openCreateStoreModal() {
    this.storeFormMode = 'create';
    this.storeFormData = { id: 0, name: '', address: '', city: '', isActive: true };
    this.showStoreModal = true;
  }

  openEditStoreModal(store: Store, event?: Event) {
    if (event) event.stopPropagation();
    this.storeFormMode = 'edit';
    this.storeFormData = {
      id: store.id,
      name: store.name,
      address: store.address || '',
      city: store.city || '',
      isActive: store.isActive
    };
    this.showStoreModal = true;
  }

  saveStore() {
    if (!this.storeFormData.name.trim()) {
      this.showAlert('اسم الفرع / المتجر مطلوب.', 'danger');
      return;
    }
    if (this.storeFormMode === 'create') {
      this.storeService.createStore({
        name: this.storeFormData.name,
        address: this.storeFormData.address,
        city: this.storeFormData.city
      }).subscribe({
        next: (res) => {
          this.showAlert('تم إنشاء الفرع بنجاح.', 'success');
          this.showStoreModal = false;
          this.loadStores(res.data?.id);
        },
        error: (err) => this.showAlert(err.error?.message || 'تعذر إضافة الفرع.', 'danger')
      });
    } else {
      this.storeService.updateStore(this.storeFormData.id, {
        name: this.storeFormData.name,
        address: this.storeFormData.address,
        city: this.storeFormData.city,
        isActive: this.storeFormData.isActive
      }).subscribe({
        next: () => {
          this.showAlert('تم حفظ تعديلات الفرع بنجاح.', 'success');
          this.showStoreModal = false;
          this.loadStores(this.storeFormData.id);
        },
        error: (err) => this.showAlert(err.error?.message || 'تعذر تعديل الفرع.', 'danger')
      });
    }
  }

  deleteStore(store: Store, event: Event) {
    event.stopPropagation();
    if (!confirm(`هل أنت متأكد من حذف الفرع "${store.name}" وكافة منتجاته وأقسامه؟`)) return;
    this.storeService.deleteStore(store.id).subscribe({
      next: () => {
        this.showAlert('تم حذف الفرع بنجاح.', 'success');
        this.loadStores();
      },
      error: (err) => this.showAlert(err.error?.message || 'تعذر حذف الفرع.', 'danger')
    });
  }

  // --- Categories & Store Map ---
  loadCategories() {
    if (!this.selectedStore) return;
    this.isLoadingCategories = true;
    this.categoryService.getStoreCategories(this.selectedStore.id).subscribe({
      next: (res) => {
        this.isLoadingCategories = false;
        this.categories = res.data || [];
        this.initCategoryPositions();
        if (this.selectedCategoryForMap) {
          this.selectedCategoryForMap = this.categories.find(c => c.id === this.selectedCategoryForMap!.id) || null;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingCategories = false;
        this.showAlert('تعذر جلب الأقسام.', 'danger');
        this.cdr.detectChanges();
      }
    });
  }

  private initCategoryPositions() {
    if (this.selectedStore?.latitude && this.selectedStore?.longitude) {
      const ex = parseFloat(this.selectedStore.latitude);
      const ey = parseFloat(this.selectedStore.longitude);
      if (!isNaN(ex) && !isNaN(ey) && ex > 0 && ey > 0) {
        this.entrancePosition = { x: ex, y: ey };
      }
    } else {
      try {
        const savedBeacon = localStorage.getItem('mudar_beacon_pos');
        if (savedBeacon) {
          this.entrancePosition = JSON.parse(savedBeacon);
        }
      } catch { }
    }

    // Read saved positions or lay them out smartly using perimeterSlots
    this.categories.forEach((cat, index) => {
      if (cat.gridX != null && cat.gridY != null && cat.gridX > 0 && cat.gridY > 0) {
        this.categoryPositions[cat.id] = { x: cat.gridX, y: cat.gridY };
      } else {
        const slot = this.getPerimeterSlot(index);
        this.categoryPositions[cat.id] = { x: slot.x, y: slot.y };
      }
    });
  }

  // --- Drag and Drop Logic (Touch, Mobile, Tablet, Mouse) ---
  startDrag(type: 'beacon' | 'category' | 'subcategory', id?: number, event?: MouseEvent | TouchEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.dragMoved = false;
    this.draggingItem = {
      type,
      id,
      offsetX: 0,
      offsetY: 0
    };
  }

  onTouchStart(type: 'beacon' | 'category' | 'subcategory', id?: number, event?: TouchEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.dragMoved = false;
    this.draggingItem = {
      type,
      id,
      offsetX: 0,
      offsetY: 0
    };
  }

  onCanvasMouseMove(event: MouseEvent) {
    if (!this.draggingItem) return;
    this.dragMoved = true;
    const canvas = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const clientX = event.clientX;
    const clientY = event.clientY;

    let xPercent = Math.round(((clientX - canvas.left) / canvas.width) * 100);
    let yPercent = Math.round(((clientY - canvas.top) / canvas.height) * 100);

    // Clamp inside viewport
    xPercent = Math.max(5, Math.min(95, xPercent));
    yPercent = Math.max(5, Math.min(95, yPercent));

    if (this.draggingItem.type === 'beacon') {
      this.entrancePosition = { x: xPercent, y: yPercent };
    } else if (this.draggingItem.id) {
      this.categoryPositions[this.draggingItem.id] = { x: xPercent, y: yPercent };
    }
    this.cdr.detectChanges();
  }

  onTouchMove(event: TouchEvent) {
    if (!this.draggingItem || !event.touches || event.touches.length === 0) return;
    this.dragMoved = true;
    if (event.cancelable) {
      event.preventDefault(); // Stop mobile browser page scrolling while dragging
    }
    const touch = event.touches[0];
    const canvas = (event.currentTarget as HTMLElement).getBoundingClientRect();

    let xPercent = Math.round(((touch.clientX - canvas.left) / canvas.width) * 100);
    let yPercent = Math.round(((touch.clientY - canvas.top) / canvas.height) * 100);

    // Clamp inside viewport
    xPercent = Math.max(5, Math.min(95, xPercent));
    yPercent = Math.max(5, Math.min(95, yPercent));

    if (this.draggingItem.type === 'beacon') {
      this.entrancePosition = { x: xPercent, y: yPercent };
    } else if (this.draggingItem.id) {
      this.categoryPositions[this.draggingItem.id] = { x: xPercent, y: yPercent };
    }
    this.cdr.detectChanges();
  }

  onTouchEnd() {
    this.stopDrag();
  }

  stopDrag() {
    if (!this.draggingItem) return;

    if (this.draggingItem.type === 'beacon') {
      try {
        localStorage.setItem('mudar_beacon_pos', JSON.stringify(this.entrancePosition));
      } catch { }
    } else if (this.draggingItem.id) {
      const catId = this.draggingItem.id;
      const pos = this.categoryPositions[catId];
      if (pos) {
        // Persist category position to backend PATCH endpoint
        this.categoryService.updatePosition(catId, {
          gridX: pos.x,
          gridY: pos.y
        }).subscribe({
          next: () => {
            // Updated successfully in database
          },
          error: () => {
            // Keep local position
          }
        });
      }
    }

    this.draggingItem = null;
    setTimeout(() => {
      this.dragMoved = false;
    }, 150);
    this.cdr.detectChanges();
  }

  openCreateCategoryModal(parentCat?: Category, event?: Event) {
    if (event) event.stopPropagation();
    this.categoryFormMode = 'create';
    this.categoryFormData = {
      id: 0,
      name: '',
      description: '',
      parentCategoryId: parentCat ? parentCat.id : null,
      gridX: 0,
      gridY: 0,
      width: 1,
      height: 1,
      colorHex: '#B08D57',
      isVisible: true
    };
    this.showCategoryModal = true;
    this.cdr.detectChanges();
  }

  openEditCategoryModal(c: Category, event?: Event) {
    if (event) event.stopPropagation();
    this.categoryFormMode = 'edit';
    this.categoryFormData = {
      id: c.id,
      name: c.name,
      description: c.description || '',
      parentCategoryId: c.parentCategoryId || null,
      gridX: c.gridX || 0,
      gridY: c.gridY || 0,
      width: c.width || 1,
      height: c.height || 1,
      colorHex: c.colorHex || '#1e3a8a',
      isVisible: c.isVisible
    };
    this.showCategoryModal = true;
  }

  saveCategory() {
    if (!this.selectedStore) return;
    if (!this.categoryFormData.name.trim()) {
      this.showAlert('اسم القسم مطلوب.', 'danger');
      return;
    }

    if (this.categoryFormMode === 'create') {
      this.categoryService.createCategory({
        name: this.categoryFormData.name,
        description: this.categoryFormData.description,
        storeId: this.selectedStore.id,
        parentCategoryId: this.categoryFormData.parentCategoryId,
        gridX: this.categoryFormData.gridX,
        gridY: this.categoryFormData.gridY,
        width: this.categoryFormData.width,
        height: this.categoryFormData.height,
        colorHex: this.categoryFormData.colorHex,
        isVisible: this.categoryFormData.isVisible
      }).subscribe({
        next: () => {
          this.showAlert('تم إنشاء القسم بنجاح.', 'success');
          this.showCategoryModal = false;
          this.loadCategories();
          this.loadStores(this.selectedStore?.id);
        },
        error: (err) => this.showAlert(err.error?.message || 'تعذر إضافة القسم.', 'danger')
      });
    } else {
      this.categoryService.updateCategory(this.categoryFormData.id, {
        name: this.categoryFormData.name,
        description: this.categoryFormData.description,
        parentCategoryId: this.categoryFormData.parentCategoryId,
        gridX: this.categoryFormData.gridX,
        gridY: this.categoryFormData.gridY,
        width: this.categoryFormData.width,
        height: this.categoryFormData.height,
        colorHex: this.categoryFormData.colorHex,
        isVisible: this.categoryFormData.isVisible
      }).subscribe({
        next: () => {
          this.showAlert('تم تعديل القسم بنجاح.', 'success');
          this.showCategoryModal = false;
          this.loadCategories();
        },
        error: (err) => this.showAlert(err.error?.message || 'تعذر تعديل القسم.', 'danger')
      });
    }
  }

  toggleCategoryVisibility(c: Category, event: Event) {
    event.stopPropagation();
    const newStatus = !c.isVisible;
    this.categoryService.toggleVisibility(c.id, newStatus).subscribe({
      next: () => {
        c.isVisible = newStatus;
        this.showAlert(newStatus ? 'تم إظهار القسم للزبائن.' : 'تم إخفاء القسم بنجاح.', 'success');
      },
      error: () => this.showAlert('تعذر تعديل حالة العرض.', 'danger')
    });
  }

  promptDeleteCategory(c: Category, event: Event) {
    event.stopPropagation();
    if (c.isDefault) {
      this.showAlert('لا يمكن حذف قسم "متنوعة" الافتراضي، يمكنك إخفاؤه فقط.', 'danger');
      return;
    }
    this.deletingCategory = c;
    this.deleteProductsChoice = false;
    this.showDeleteCatModal = true;
  }

  confirmDeleteCategory() {
    if (!this.deletingCategory) return;
    const catToDelete = this.deletingCategory;
    this.categoryService.deleteCategory(catToDelete.id, this.deleteProductsChoice).subscribe({
      next: (res) => {
        this.showAlert(res.message || 'تم حذف القسم بنجاح.', 'success');
        this.showDeleteCatModal = false;
        this.deletingCategory = null;
        if (this.selectedCategoryForMap?.id === catToDelete.id) {
          this.selectedCategoryForMap = null;
        }
        this.loadCategories();
        this.loadProducts();
        this.loadStores(this.selectedStore?.id);
      },
      error: (err) => this.showAlert(err.error?.message || 'تعذر حذف القسم.', 'danger')
    });
  }

  // Map interactions & Layout (Matching Reference Images 5 & 6)
  getCategoryColor(cat: Category, index: number): string {
    if (cat.colorHex && cat.colorHex !== '#B08D57' && cat.colorHex !== '#ffffff' && cat.colorHex.startsWith('#')) {
      return cat.colorHex;
    }
    return this.luxuryCategoryColors[index % this.luxuryCategoryColors.length];
  }

  getPerimeterSlot(index: number): { x: number; y: number } {
    return this.perimeterSlots[index % this.perimeterSlots.length];
  }

  isCategoryActive(cat: Category): boolean {
    return this.selectedCategoryForMap?.id === cat.id;
  }

  getActiveCategoryPinCoords(): { x: number; y: number } | null {
    if (!this.selectedCategoryForMap) return null;
    const catId = this.selectedCategoryForMap.id;
    const pos = this.categoryPositions[catId];
    if (!pos) {
      const idx = this.categories.findIndex(c => c.id === catId);
      const slot = this.getPerimeterSlot(idx >= 0 ? idx : 0);
      return { x: slot.x, y: Math.min(94, slot.y + 14) };
    }
    return {
      x: pos.x,
      y: Math.min(94, pos.y + 14)
    };
  }

  onCategoryCardClick(cat: Category, event: MouseEvent) {
    if (this.dragMoved) return;
    event.stopPropagation();
    if (this.selectedCategoryForMap?.id === cat.id) {
      // Keep open or toggle subcategory if needed
    } else {
      this.selectCategoryForMap(cat);
    }
  }

  onSubCategoryClick(sub: Category, event: MouseEvent) {
    event.stopPropagation();
    if (this.dragMoved) return;
    if (this.selectedSubCategoryForMap?.id === sub.id) {
      this.selectedSubCategoryForMap = null;
      this.selectedMapFilterSubCategoryId = null;
      if (this.selectedCategoryForMap) {
        this.loadCategoryMapProducts(this.selectedCategoryForMap.id);
      }
    } else {
      this.selectedSubCategoryForMap = sub;
      this.selectedMapFilterSubCategoryId = sub.id;
      this.loadCategoryMapProducts(sub.id);
    }
  }

  onCanvasBackgroundClick(event: MouseEvent) {
    if (this.dragMoved) return;
    const target = event.target as HTMLElement;
    if (target.classList.contains('map-viewport-interactive') || target.tagName.toLowerCase() === 'svg' || target.classList.contains('map-path-svg-overlay')) {
      this.clearMapSelection();
    }
  }

  autoArrangeMapLayout() {
    this.categories.forEach((cat, idx) => {
      const slot = this.getPerimeterSlot(idx);
      this.categoryPositions[cat.id] = { x: slot.x, y: slot.y };
      this.categoryService.updatePosition(cat.id, { gridX: slot.x, gridY: slot.y }).subscribe({
        error: () => { }
      });
    });
    this.entrancePosition = { x: 50, y: 90 };
    try {
      localStorage.setItem('mudar_beacon_pos', JSON.stringify(this.entrancePosition));
    } catch { }
    this.showAlert('تم إعادة ترتيب أقسام المتجر على محيط الصالة تلقائياً.', 'success');
    this.cdr.detectChanges();
  }

  selectCategoryForMap(c: Category) {
    this.selectedCategoryForMap = c;
    this.selectedSubCategoryForMap = null;
    this.selectedMapFilterSubCategoryId = null;
    this.loadCategoryMapProducts(c.id);
  }

  clearMapSelection() {
    this.selectedCategoryForMap = null;
    this.selectedSubCategoryForMap = null;
    this.selectedMapFilterSubCategoryId = null;
    this.categoryMapProducts = [];
    this.cdr.detectChanges();
  }

  loadCategoryMapProducts(categoryId: number) {
    if (!this.selectedStore) return;
    this.isLoadingMapProductsList = true;
    this.categoryMapProducts = [];
    this.cdr.detectChanges();

    this.productService.getStoreProducts(this.selectedStore.id, categoryId).subscribe({
      next: (res) => {
        this.isLoadingMapProductsList = false;
        this.categoryMapProducts = res.data || [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingMapProductsList = false;
        this.cdr.detectChanges();
      }
    });
  }

  selectSubCategory(sub: Category) {
    this.selectedSubCategoryForMap = sub;
  }

  onSubCategoryBoxClick(sub: Category) {
    if (this.dragMoved) return;
    if (this.selectedSubCategoryForMap?.id === sub.id) {
      // Toggle off subcategory filter and show all products of the parent category
      this.selectedSubCategoryForMap = null;
      this.selectedMapFilterSubCategoryId = null;
      if (this.selectedCategoryForMap) {
        this.loadCategoryMapProducts(this.selectedCategoryForMap.id);
      }
    } else {
      this.selectedSubCategoryForMap = sub;
      this.selectedMapFilterSubCategoryId = sub.id;
      this.loadCategoryMapProducts(sub.id);
    }
  }

  onFloorCategoryBoxClick(cat: Category) {
    if (this.dragMoved) return;
    this.selectCategoryForMap(cat);
  }

  // --- Devices Management (Connected to Backend API) ---
  loadDevices() {
    if (!this.selectedStore) {
      this.devices = [];
      return;
    }
    this.isLoadingDevices = true;
    this.deviceService.getStoreDevices(this.selectedStore.id).subscribe({
      next: (res) => {
        this.isLoadingDevices = false;
        this.devices = res.data || [];
        if (this.selectedStore) {
          this.selectedStore.devicesCount = this.devices.length;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingDevices = false;
        this.devices = [];
        this.cdr.detectChanges();
      }
    });
  }

  getStoreDevices(): any[] {
    return this.devices;
  }

  openCreateDeviceModal() {
    this.deviceFormData = {
      name: '',
      deviceCode: 'DEV-' + Math.floor(1000 + Math.random() * 9000),
      type: 'SmartCamera',
      isOnline: true
    };
    this.showDeviceModal = true;
    this.cdr.detectChanges();
  }

  saveDevice() {
    if (!this.selectedStore) return;
    if (!this.deviceFormData.name.trim() || !this.deviceFormData.deviceCode.trim()) {
      this.showAlert('يرجى كتابة اسم الجهاز وكود الجهاز التعريفي.', 'danger');
      return;
    }

    this.deviceService.createDevice({
      storeId: this.selectedStore.id,
      name: this.deviceFormData.name.trim(),
      deviceCode: this.deviceFormData.deviceCode.trim(),
      type: this.deviceFormData.type
    }).subscribe({
      next: () => {
        this.showDeviceModal = false;
        this.showAlert('تم تسجيل وربط الجهاز بنجاح في قاعدة البيانات.', 'success');
        this.loadDevices();
      },
      error: (err) => {
        this.showAlert(err?.error?.message || 'تعذر تسجيل الجهاز.', 'danger');
      }
    });
  }

  deleteDevice(device: any) {
    if (!this.selectedStore) return;
    if (!confirm(`هل أنت متأكد من إزالة الجهاز "${device.name}"؟`)) return;
    this.deviceService.deleteDevice(device.id).subscribe({
      next: () => {
        this.showAlert('تم حذف الجهاز بنجاح من قاعدة البيانات.', 'info');
        this.loadDevices();
      },
      error: (err) => {
        this.showAlert(err?.error?.message || 'تعذر إزالة الجهاز.', 'danger');
      }
    });
  }

  toggleDeviceStatus(device: any) {
    const newStatus = !device.isOnline;
    this.deviceService.updateStatus(device.id, newStatus).subscribe({
      next: () => {
        device.isOnline = newStatus;
        this.showAlert(`تم تحديث حالة الجهاز إلى ${newStatus ? 'متصل' : 'غير متصل'}.`, 'success');
        this.cdr.detectChanges();
      },
      error: () => {
        this.showAlert('تعذر تحديث حالة الجهاز.', 'danger');
      }
    });
  }

  // --- Save Map Coordinates to Backend API ---
  saveMapLayout() {
    if (!this.selectedStore) return;
    this.isSavingMapLayout = true;
    const catPositions = Object.keys(this.categoryPositions).map(k => ({
      categoryId: parseInt(k, 10),
      gridX: Math.round(this.categoryPositions[parseInt(k, 10)].x),
      gridY: Math.round(this.categoryPositions[parseInt(k, 10)].y)
    }));

    const payload = {
      entranceX: Math.round(this.entrancePosition.x),
      entranceY: Math.round(this.entrancePosition.y),
      categories: catPositions
    };

    this.categoryService.saveMapLayout(this.selectedStore.id, payload).subscribe({
      next: () => {
        this.isSavingMapLayout = false;
        if (this.selectedStore) {
          this.selectedStore.latitude = payload.entranceX.toString();
          this.selectedStore.longitude = payload.entranceY.toString();
        }
        this.showAlert('تم الحفظ', 'success');
        this.cdr.detectChanges();
      },
      error: () => {
        this.isSavingMapLayout = false;
        this.showAlert('تعذر حفظ إحداثيات الخريطة على الخادم.', 'danger');
        this.cdr.detectChanges();
      }
    });
  }

  getDeviceTypeLabel(type: string): string {
    const found = this.deviceTypes.find(t => t.value === type);
    return found ? found.label : type;
  }

  openCategoryProductsModal(cat: Category) {
    if (!this.selectedStore) return;
    this.modalCategory = cat;
    this.showCategoryProductsModal = true;
    this.isLoadingModalProducts = true;
    this.modalProducts = [];
    this.cdr.detectChanges();

    this.productService.getStoreProducts(this.selectedStore.id, cat.id).subscribe({
      next: (res) => {
        this.isLoadingModalProducts = false;
        this.modalProducts = res.data || [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingModalProducts = false;
        this.cdr.detectChanges();
      }
    });
  }

  closeCategoryProductsModal() {
    this.showCategoryProductsModal = false;
    this.modalCategory = null;
    this.modalProducts = [];
    this.cdr.detectChanges();
  }

  goToProductsPageForCategory(catId: number) {
    this.closeCategoryProductsModal();
    this.productFilterCategory = catId;
    this.setTab('products');
    this.loadProducts();
  }

  openAddProductForCategory(cat: Category | null) {
    this.closeCategoryProductsModal();
    this.openCreateProductModal();
    if (cat) {
      this.productFormData.categoryId = cat.id;
    }
  }

  // --- Products Management ---
  loadProducts() {
    if (!this.selectedStore) return;
    this.isLoadingProducts = true;
    this.productService.getStoreProducts(this.selectedStore.id, this.productFilterCategory).subscribe({
      next: (res) => {
        this.isLoadingProducts = false;
        this.products = res.data || [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingProducts = false;
        this.showAlert('تعذر جلب المنتجات.', 'danger');
        this.cdr.detectChanges();
      }
    });
  }

  searchProductByBarcode() {
    if (!this.selectedStore) return;
    if (!this.productSearchBarcode.trim()) {
      this.loadProducts();
      return;
    }
    this.productService.getProductByBarcode(this.selectedStore.id, this.productSearchBarcode.trim()).subscribe({
      next: (res) => {
        if (res.data) {
          this.products = [res.data];
        } else {
          this.products = [];
          this.showAlert('لم يتم العثور على منتج بهذا الباركود.', 'info');
        }
      },
      error: () => {
        this.products = [];
        this.showAlert('لم يتم العثور على منتج بهذا الباركود.', 'info');
      }
    });
  }

  openCreateProductModal() {
    this.productFormMode = 'create';
    this.productFormData = {
      id: 0,
      name: '',
      description: '',
      barcode: '',
      price: 0,
      stock: 0,
      categoryId: null,
      isVisible: true
    };
    this.showProductModal = true;
  }

  openEditProductModal(p: Product) {
    this.productFormMode = 'edit';
    this.productFormData = {
      id: p.id,
      name: p.name,
      description: p.description || '',
      barcode: p.barcode,
      price: p.price,
      stock: p.stock,
      categoryId: p.categoryId,
      isVisible: p.isVisible
    };
    this.showProductModal = true;
  }

  saveProduct() {
    if (!this.selectedStore) return;
    if (!this.productFormData.name.trim() || !this.productFormData.barcode.trim()) {
      this.showAlert('اسم المنتج والباركود كلاهما مطلوب.', 'danger');
      return;
    }

    if (this.productFormMode === 'create') {
      this.productService.createProduct({
        name: this.productFormData.name,
        description: this.productFormData.description,
        barcode: this.productFormData.barcode,
        price: this.productFormData.price,
        stock: this.productFormData.stock,
        categoryId: this.productFormData.categoryId,
        storeId: this.selectedStore.id,
        isVisible: this.productFormData.isVisible
      }).subscribe({
        next: () => {
          this.showAlert('تمت إضافة المنتج بنجاح.', 'success');
          this.showProductModal = false;
          this.loadProducts();
          this.loadCategories();
          this.loadStores(this.selectedStore?.id);
        },
        error: (err) => this.showAlert(err.error?.message || 'تعذر إضافة المنتج.', 'danger')
      });
    } else {
      this.productService.updateProduct(this.productFormData.id, {
        name: this.productFormData.name,
        description: this.productFormData.description,
        barcode: this.productFormData.barcode,
        price: this.productFormData.price,
        stock: this.productFormData.stock,
        categoryId: this.productFormData.categoryId || 1,
        isVisible: this.productFormData.isVisible
      }).subscribe({
        next: () => {
          this.showAlert('تم حفظ تعديلات المنتج بنجاح.', 'success');
          this.showProductModal = false;
          this.loadProducts();
          this.loadCategories();
        },
        error: (err) => this.showAlert(err.error?.message || 'تعذر تعديل المنتج.', 'danger')
      });
    }
  }

  toggleProductVisibility(p: Product) {
    const newStatus = !p.isVisible;
    this.productService.toggleVisibility(p.id, newStatus).subscribe({
      next: () => {
        p.isVisible = newStatus;
        this.showAlert(newStatus ? 'المنتج معروض للزبائن الآن.' : 'تم إخفاء المنتج بنجاح.', 'success');
      },
      error: () => this.showAlert('تعذر تعديل حالة المنتج.', 'danger')
    });
  }

  deleteProduct(p: Product) {
    if (!confirm(`هل أنت متأكد من حذف المنتج "${p.name}" نهائياً؟`)) return;
    this.productService.deleteProduct(p.id).subscribe({
      next: () => {
        this.showAlert('تم حذف المنتج بنجاح.', 'success');
        this.loadProducts();
        this.loadCategories();
        this.loadStores(this.selectedStore?.id);
      },
      error: () => this.showAlert('تعذر حذف المنتج.', 'danger')
    });
  }

  // Total products sum for owner
  getTotalProductsCount(): number {
    return this.stores.reduce((acc, s) => acc + (s.productsCount || 0), 0);
  }

  getTotalCategoriesCount(): number {
    return this.stores.reduce((acc, s) => acc + (s.categoriesCount || 0), 0);
  }
}
