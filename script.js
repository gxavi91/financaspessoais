const STORAGE_KEY = "financas-pessoais-html:v1";

const expenseCategories = [
  "Supermercado",
  "Casa",
  "Renda/Prestação",
  "Transportes",
  "Restauração",
  "Saúde",
  "Lazer",
  "Educação",
  "Seguros",
  "Subscrições",
  "Outros",
];

const incomeCategories = [
  "Salário",
  "Freelance",
  "Subsídio",
  "Reembolso",
  "Juros",
  "Venda",
  "Outros",
];

const defaultData = {
  version: 2,
  transactions: [],
  fixedExpenses: [],
  netWorth: [],
  settings: {
    theme: "dark",
    appTitle: "Farol",
    appSubtitle: "Finan\u00e7as pessoais",
    logoDataUrl: "",
    customExpenseCategories: [],
    customIncomeCategories: [],
  },
};

const money = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
});

const compactMoney = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  maximumFractionDigits: 1,
});

const monthFormatter = new Intl.DateTimeFormat("pt-PT", {
  month: "long",
  year: "numeric",
});

const shortMonthFormatter = new Intl.DateTimeFormat("pt-PT", {
  month: "short",
});

let state = normalizeData(loadData());
let selectedType = "expense";
let selectedMonth = currentMonthKey();
let activeView = "dashboard";
let lastPresetId = "";
let settingsDraft = null;

const els = {
  views: document.querySelectorAll(".view"),
  navButtons: document.querySelectorAll("[data-view-target]"),
  monthPicker: document.querySelector("#monthPicker"),
  incomeTotal: document.querySelector("#incomeTotal"),
  expenseTotal: document.querySelector("#expenseTotal"),
  balanceTotal: document.querySelector("#balanceTotal"),
  savingsRate: document.querySelector("#savingsRate"),
  insightList: document.querySelector("#insightList"),
  comparisonGrid: document.querySelector("#comparisonGrid"),
  categoryBreakdown: document.querySelector("#categoryBreakdown"),
  transactionGroups: document.querySelector("#transactionGroups"),
  monthlyChart: document.querySelector("#monthlyChart"),
  netWorthChart: document.querySelector("#netWorthChart"),
  investmentChart: document.querySelector("#investmentChart"),
  brandLogo: document.querySelector("#brandLogo"),
  brandTitle: document.querySelector("#brandTitle"),
  brandSubtitle: document.querySelector("#brandSubtitle"),
  quickExpense: document.querySelector("#quickExpense"),
  quickIncome: document.querySelector("#quickIncome"),
  addFromList: document.querySelector("#addFromList"),
  movementDialog: document.querySelector("#movementDialog"),
  movementDialogTitle: document.querySelector("#movementDialogTitle"),
  movementForm: document.querySelector("#movementForm"),
  closeMovement: document.querySelector("#closeMovement"),
  amount: document.querySelector("#amount"),
  category: document.querySelector("#category"),
  categoryChips: document.querySelector("#categoryChips"),
  description: document.querySelector("#description"),
  date: document.querySelector("#date"),
  fixedPresetWrap: document.querySelector("#fixedPresetWrap"),
  fixedPresetSelect: document.querySelector("#fixedPresetSelect"),
  fixedForm: document.querySelector("#fixedForm"),
  fixedName: document.querySelector("#fixedName"),
  fixedAmount: document.querySelector("#fixedAmount"),
  fixedDay: document.querySelector("#fixedDay"),
  fixedCategory: document.querySelector("#fixedCategory"),
  fixedList: document.querySelector("#fixedList"),
  netWorthForm: document.querySelector("#netWorthForm"),
  netWorthAmount: document.querySelector("#netWorthAmount"),
  netWorthDate: document.querySelector("#netWorthDate"),
  netWorthNote: document.querySelector("#netWorthNote"),
  netWorthTotal: document.querySelector("#netWorthTotal"),
  netWorthChange: document.querySelector("#netWorthChange"),
  netWorthCount: document.querySelector("#netWorthCount"),
  netWorthList: document.querySelector("#netWorthList"),
  simInitial: document.querySelector("#simInitial"),
  simContribution: document.querySelector("#simContribution"),
  simFrequency: document.querySelector("#simFrequency"),
  simReturn: document.querySelector("#simReturn"),
  simYears: document.querySelector("#simYears"),
  simFinal: document.querySelector("#simFinal"),
  simInvested: document.querySelector("#simInvested"),
  simInterest: document.querySelector("#simInterest"),
  settingsBtn: document.querySelector("#settingsBtn"),
  settingsDialog: document.querySelector("#settingsDialog"),
  closeSettings: document.querySelector("#closeSettings"),
  cancelSettingsBtn: document.querySelector("#cancelSettingsBtn"),
  saveSettingsBtn: document.querySelector("#saveSettingsBtn"),
  appTitleInput: document.querySelector("#appTitleInput"),
  appSubtitleInput: document.querySelector("#appSubtitleInput"),
  logoInput: document.querySelector("#logoInput"),
  logoPreview: document.querySelector("#logoPreview"),
  removeLogoBtn: document.querySelector("#removeLogoBtn"),
  categoryTypeInput: document.querySelector("#categoryTypeInput"),
  customCategoryInput: document.querySelector("#customCategoryInput"),
  addCategoryBtn: document.querySelector("#addCategoryBtn"),
  customCategoryList: document.querySelector("#customCategoryList"),
  exportBtn: document.querySelector("#settingsExportBtn"),
  importInput: document.querySelector("#settingsImportInput"),
  themeBtn: document.querySelector("#themeBtn"),
};

init();

function init() {
  els.monthPicker.value = selectedMonth;
  els.date.value = todayKey();
  els.netWorthDate.value = todayKey();
  applyTheme();
  bindEvents();
  render();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

function bindEvents() {
  els.navButtons.forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.viewTarget));
  });

  els.themeBtn.addEventListener("click", () => {
    state.settings.theme = state.settings.theme === "light" ? "dark" : "light";
    saveState();
    applyTheme();
    renderChartsSoon();
  });

  els.settingsBtn.addEventListener("click", () => openSettingsDialog());
  els.closeSettings.addEventListener("click", () => cancelSettingsDialog());
  els.cancelSettingsBtn.addEventListener("click", () => cancelSettingsDialog());
  els.saveSettingsBtn.addEventListener("click", () => saveSettingsDialog());
  els.settingsDialog.addEventListener("click", (event) => {
    if (event.target === els.settingsDialog) cancelSettingsDialog();
  });

  els.appTitleInput.addEventListener("input", updateSettingsDraftFromInputs);
  els.appSubtitleInput.addEventListener("input", updateSettingsDraftFromInputs);
  els.logoInput.addEventListener("change", handleLogoUpload);
  els.removeLogoBtn.addEventListener("click", () => {
    ensureSettingsDraft();
    settingsDraft.logoDataUrl = "";
    syncSettingsInputs();
  });

  els.categoryTypeInput.addEventListener("change", renderCustomCategories);
  els.addCategoryBtn.addEventListener("click", addCustomCategory);
  els.customCategoryInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addCustomCategory();
    }
  });
  els.customCategoryList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-custom-category]");
    if (!button) return;
    deleteCustomCategory(button.dataset.deleteCustomCategory);
  });

  els.monthPicker.addEventListener("change", () => {
    selectedMonth = els.monthPicker.value || currentMonthKey();
    render();
  });

  els.quickExpense.addEventListener("click", () => openMovementDialog("expense"));
  els.quickIncome.addEventListener("click", () => openMovementDialog("income"));
  els.addFromList.addEventListener("click", () => openMovementDialog("expense"));

  document.querySelectorAll(".segmented button").forEach((button) => {
    button.addEventListener("click", () => setMovementType(button.dataset.type));
  });

  els.closeMovement.addEventListener("click", () => closeMovementDialog());
  els.movementDialog.addEventListener("click", (event) => {
    if (event.target === els.movementDialog) closeMovementDialog();
  });

  els.fixedPresetSelect.addEventListener("change", () => {
    const preset = state.fixedExpenses.find((item) => item.id === els.fixedPresetSelect.value);
    if (preset) fillMovementFromFixed(preset);
  });

  els.category.addEventListener("change", () => renderCategoryChips());

  els.movementForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveMovement();
  });

  els.fixedForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveFixedExpense();
  });

  els.fixedList.addEventListener("click", (event) => {
    const useId = event.target.closest("[data-use-fixed]")?.dataset.useFixed;
    const deleteId = event.target.closest("[data-delete-fixed]")?.dataset.deleteFixed;

    if (useId) {
      const fixed = state.fixedExpenses.find((item) => item.id === useId);
      if (fixed) openMovementDialog("expense", fixed);
    }

    if (deleteId) {
      state.fixedExpenses = state.fixedExpenses.filter((item) => item.id !== deleteId);
      saveAndRender();
    }
  });

  els.transactionGroups.addEventListener("click", (event) => {
    const id = event.target.closest("[data-delete-transaction]")?.dataset.deleteTransaction;
    if (!id) return;
    state.transactions = state.transactions.filter((transaction) => transaction.id !== id);
    saveAndRender();
  });

  els.netWorthForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveNetWorth();
  });

  els.netWorthList.addEventListener("click", (event) => {
    const id = event.target.closest("[data-delete-worth]")?.dataset.deleteWorth;
    if (!id) return;
    state.netWorth = state.netWorth.filter((item) => item.id !== id);
    saveAndRender();
  });

  [
    els.simInitial,
    els.simContribution,
    els.simFrequency,
    els.simReturn,
    els.simYears,
  ].forEach((input) => {
    input.addEventListener("input", renderSimulator);
    input.addEventListener("change", renderSimulator);
  });

  els.exportBtn.addEventListener("click", exportData);
  els.importInput.addEventListener("change", importData);
  window.addEventListener("resize", debounce(renderChartsSoon, 120));
}

function switchView(viewName) {
  activeView = viewName;
  els.views.forEach((view) => {
    view.classList.toggle("active", view.id === `view-${viewName}`);
  });
  els.navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.viewTarget === viewName);
  });
  renderChartsSoon();
}

function openSettingsDialog() {
  settingsDraft = cloneSettings(state.settings);
  syncSettingsInputs();
  renderCustomCategories();
  if (els.settingsDialog.showModal) {
    els.settingsDialog.showModal();
  } else {
    els.settingsDialog.setAttribute("open", "");
  }
}

function closeSettingsDialog() {
  settingsDraft = null;
  if (els.settingsDialog.close) {
    els.settingsDialog.close();
  } else {
    els.settingsDialog.removeAttribute("open");
  }
}

function cancelSettingsDialog() {
  settingsDraft = null;
  syncSettingsInputs();
  renderCustomCategories();
  closeSettingsDialog();
}

function saveSettingsDialog() {
  updateSettingsDraftFromInputs();
  state.settings = cloneSettings(settingsDraft || state.settings);
  saveState();
  render();
  closeSettingsDialog();
}

function cloneSettings(settings) {
  return {
    theme: settings.theme === "light" ? "light" : "dark",
    appTitle: settings.appTitle || "Farol",
    appSubtitle: settings.appSubtitle || "Finan\u00e7as pessoais",
    logoDataUrl: settings.logoDataUrl || "",
    customExpenseCategories: sanitizeCategoryList(settings.customExpenseCategories),
    customIncomeCategories: sanitizeCategoryList(settings.customIncomeCategories),
  };
}

function ensureSettingsDraft() {
  if (!settingsDraft) settingsDraft = cloneSettings(state.settings);
  return settingsDraft;
}

function renderBrand() {
  const title = state.settings.appTitle?.trim() || "Farol";
  const subtitle = state.settings.appSubtitle?.trim() || "Finan\u00e7as pessoais";
  els.brandTitle.textContent = title;
  els.brandSubtitle.textContent = subtitle;
  document.title = `${title} - ${subtitle}`;

  const fallback = escapeHtml(title.trim().charAt(0).toUpperCase() || "F");
  const logo = state.settings.logoDataUrl;
  const content = logo ? `<img src="${escapeHtml(logo)}" alt="" />` : fallback;
  els.brandLogo.innerHTML = content;
  els.logoPreview.innerHTML = content;
}

function syncSettingsInputs() {
  const source = settingsDraft || state.settings;
  if (document.activeElement !== els.appTitleInput) {
    els.appTitleInput.value = source.appTitle || "Farol";
  }
  if (document.activeElement !== els.appSubtitleInput) {
    els.appSubtitleInput.value = source.appSubtitle || "Finan\u00e7as pessoais";
  }
  renderSettingsLogoPreview(source);
}

function updateSettingsDraftFromInputs() {
  const draft = ensureSettingsDraft();
  draft.appTitle = els.appTitleInput.value.trim() || "Farol";
  draft.appSubtitle = els.appSubtitleInput.value.trim() || "Finan\u00e7as pessoais";
}

function renderSettingsLogoPreview(settings) {
  const title = settings.appTitle?.trim() || "Farol";
  const fallback = escapeHtml(title.charAt(0).toUpperCase() || "F");
  const logo = settings.logoDataUrl;
  els.logoPreview.innerHTML = logo ? `<img src="${escapeHtml(logo)}" alt="" />` : fallback;
}

function handleLogoUpload() {
  const file = els.logoInput.files?.[0];
  if (!file) return;

  resizeImageFile(file)
    .then((dataUrl) => {
      const draft = ensureSettingsDraft();
      draft.logoDataUrl = dataUrl;
      renderSettingsLogoPreview(draft);
    })
    .catch(() => {
      window.alert("N\u00e3o foi poss\u00edvel usar essa imagem.");
    })
    .finally(() => {
      els.logoInput.value = "";
    });
}

function resizeImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(String(reader.result));
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const side = Math.min(img.width, img.height);
        const sx = Math.max(0, (img.width - side) / 2);
        const sy = Math.max(0, (img.height - side) / 2);
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.86));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function addCustomCategory() {
  const draft = ensureSettingsDraft();
  const name = els.customCategoryInput.value.trim();
  const type = els.categoryTypeInput.value === "income" ? "income" : "expense";
  if (!name) return;

  const key = type === "income" ? "customIncomeCategories" : "customExpenseCategories";
  const exists = getCategories(type, draft).some(
    (category) => category.toLocaleLowerCase("pt-PT") === name.toLocaleLowerCase("pt-PT"),
  );

  if (!exists) {
    draft[key].push(name);
    draft[key].sort((a, b) => a.localeCompare(b, "pt-PT"));
  }

  els.customCategoryInput.value = "";
  renderCustomCategories();
}

function deleteCustomCategory(name) {
  const draft = ensureSettingsDraft();
  const type = els.categoryTypeInput.value === "income" ? "income" : "expense";
  const key = type === "income" ? "customIncomeCategories" : "customExpenseCategories";
  draft[key] = draft[key].filter((category) => category !== name);
  renderCustomCategories();
}

function renderCustomCategories() {
  const source = settingsDraft || state.settings;
  const type = els.categoryTypeInput.value === "income" ? "income" : "expense";
  const key = type === "income" ? "customIncomeCategories" : "customExpenseCategories";
  const categories = source[key] || [];

  if (!categories.length) {
    els.customCategoryList.innerHTML = `<p class="empty">Ainda n\u00e3o adicionaste categorias personalizadas deste tipo.</p>`;
    return;
  }

  els.customCategoryList.innerHTML = categories
    .map(
      (category) => `
        <div class="custom-category-item">
          <span>${escapeHtml(category)}</span>
          <button type="button" data-delete-custom-category="${escapeHtml(category)}">Apagar</button>
        </div>
      `,
    )
    .join("");
}

function openMovementDialog(type = "expense", fixed = null) {
  setMovementType(type);
  els.amount.value = "";
  els.description.value = "";
  els.date.value = todayKey();
  els.fixedPresetSelect.value = "";
  lastPresetId = "";

  if (fixed) {
    fillMovementFromFixed(fixed);
  } else {
    populateMovementCategories();
  }

  if (els.movementDialog.showModal) {
    els.movementDialog.showModal();
  } else {
    els.movementDialog.setAttribute("open", "");
  }

  setTimeout(() => els.amount.focus(), 80);
}

function closeMovementDialog() {
  if (els.movementDialog.close) {
    els.movementDialog.close();
  } else {
    els.movementDialog.removeAttribute("open");
  }
}

function setMovementType(type) {
  selectedType = type;
  document.querySelectorAll(".segmented button").forEach((button) => {
    button.classList.toggle("active", button.dataset.type === type);
  });
  els.movementDialogTitle.textContent = type === "income" ? "Nova receita" : "Nova despesa";
  els.fixedPresetWrap.hidden = type === "income";
  populateMovementCategories();
}

function populateMovementCategories() {
  const categories = getCategories(selectedType);
  els.category.innerHTML = categories
    .map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
    .join("");

  if (selectedType === "expense" && !categories.includes(els.category.value)) {
    els.category.value = "Supermercado";
  }

  if (selectedType === "income" && !categories.includes(els.category.value)) {
    els.category.value = "Salário";
  }

  renderCategoryChips();
}

function renderCategoryChips() {
  const categories = getCategories(selectedType);
  els.categoryChips.innerHTML = categories
    .map(
      (category) => `
        <button class="chip ${category === els.category.value ? "active" : ""}" type="button" data-category="${escapeHtml(category)}">
          ${escapeHtml(category)}
        </button>
      `,
    )
    .join("");

  els.categoryChips.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      els.category.value = button.dataset.category;
      renderCategoryChips();
    });
  });
}

function fillMovementFromFixed(fixed) {
  lastPresetId = fixed.id;
  els.amount.value = formatInputAmount(fixed.amount);
  els.category.value = fixed.category;
  els.description.value = fixed.name;
  els.date.value = dateForFixedDay(fixed.day);
  els.fixedPresetSelect.value = fixed.id;
  populateMovementCategories();
  els.category.value = fixed.category;
  renderCategoryChips();
}

function saveMovement() {
  const amount = parseAmount(els.amount.value);
  if (!amount || amount <= 0) return;

  const transaction = {
    id: createId(),
    type: selectedType,
    amount,
    category: els.category.value || (selectedType === "income" ? "Outros" : "Outros"),
    description: els.description.value.trim(),
    date: els.date.value || todayKey(),
    fixedId: lastPresetId || null,
    createdAt: new Date().toISOString(),
  };

  state.transactions.unshift(transaction);
  selectedMonth = transaction.date.slice(0, 7);
  els.monthPicker.value = selectedMonth;
  closeMovementDialog();
  saveAndRender();
}

function saveFixedExpense() {
  const amount = parseAmount(els.fixedAmount.value);
  const name = els.fixedName.value.trim();
  const day = clamp(Number(els.fixedDay.value || 1), 1, 31);

  if (!name || !amount || amount <= 0) return;

  state.fixedExpenses.push({
    id: createId(),
    name,
    amount,
    day,
    category: els.fixedCategory.value || "Casa",
    createdAt: new Date().toISOString(),
  });

  els.fixedForm.reset();
  els.fixedDay.value = "1";
  saveAndRender();
}

function saveNetWorth() {
  const amount = parseAmount(els.netWorthAmount.value);
  if (!amount || amount < 0) return;

  state.netWorth.push({
    id: createId(),
    amount,
    date: els.netWorthDate.value || todayKey(),
    note: els.netWorthNote.value.trim(),
    createdAt: new Date().toISOString(),
  });

  els.netWorthAmount.value = "";
  els.netWorthNote.value = "";
  els.netWorthDate.value = todayKey();
  saveAndRender();
}

function render() {
  renderBrand();
  syncSettingsInputs();
  populateFixedCategorySelect();
  renderFixedPresetSelect();
  populateMovementCategories();
  renderCustomCategories();
  renderDashboard();
  renderTransactions();
  renderFixedExpenses();
  renderNetWorth();
  renderSimulator();
  renderChartsSoon();
}

function renderDashboard() {
  const monthTransactions = transactionsForMonth(selectedMonth);
  const current = summarizeTransactions(monthTransactions);
  const previous = summarizeTransactions(transactionsForMonth(addMonths(selectedMonth, -1)));
  const fixedMonthly = state.fixedExpenses.reduce((sum, item) => sum + item.amount, 0);
  const savingsRate = current.income > 0 ? Math.round((current.balance / current.income) * 100) : 0;

  els.incomeTotal.textContent = money.format(current.income);
  els.expenseTotal.textContent = money.format(current.expense);
  els.balanceTotal.textContent = money.format(current.balance);
  els.savingsRate.textContent = `${savingsRate}%`;
  els.balanceTotal.className = current.balance >= 0 ? "income" : "expense";

  els.insightList.innerHTML = buildInsights(current, previous, monthTransactions, fixedMonthly)
    .map(
      (item) => `
        <article class="insight-item">
          <span class="badge">${escapeHtml(item.badge)}</span>
          <div>
            <strong>${escapeHtml(item.title)}</strong>
            <p>${escapeHtml(item.text)}</p>
          </div>
        </article>
      `,
    )
    .join("");

  renderComparison(current, previous);
  renderCategoryBreakdown(monthTransactions, current.expense);
}

function renderComparison(current, previous) {
  const items = [
    {
      label: "Receitas",
      value: current.income - previous.income,
      hint: "face ao mês anterior",
    },
    {
      label: "Despesas",
      value: current.expense - previous.expense,
      hint: "face ao mês anterior",
    },
    {
      label: "Saldo",
      value: current.balance - previous.balance,
      hint: "face ao mês anterior",
    },
  ];

  els.comparisonGrid.innerHTML = items
    .map(
      (item) => `
        <article class="metric-card">
          <strong class="${item.value >= 0 ? "income" : "expense"}">${formatDelta(item.value)}</strong>
          <span>${escapeHtml(item.label)} ${escapeHtml(item.hint)}</span>
        </article>
      `,
    )
    .join("");
}

function renderCategoryBreakdown(monthTransactions, totalExpense) {
  const totals = {};
  monthTransactions.forEach((transaction) => {
    if (transaction.type !== "expense") return;
    totals[transaction.category] = (totals[transaction.category] || 0) + transaction.amount;
  });

  const rows = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 6);

  if (!rows.length) {
    els.categoryBreakdown.innerHTML = `<p class="empty">Ainda não há despesas neste mês.</p>`;
    return;
  }

  els.categoryBreakdown.innerHTML = rows
    .map(([category, amount]) => {
      const percent = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
      return `
        <article class="category-row">
          <div class="category-meta">
            <strong>${escapeHtml(category)}</strong>
            <span>${money.format(amount)}</span>
          </div>
          <div class="bar"><div style="width: ${percent}%"></div></div>
        </article>
      `;
    })
    .join("");
}

function renderTransactions() {
  const transactions = [...state.transactions].sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    return dateCompare || String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
  });

  if (!transactions.length) {
    els.transactionGroups.innerHTML = `<p class="empty">Ainda não há movimentos. Adiciona a primeira despesa ou receita.</p>`;
    return;
  }

  const groups = groupBy(transactions, (transaction) => transaction.date.slice(0, 7));

  els.transactionGroups.innerHTML = Object.entries(groups)
    .map(([month, items]) => {
      const summary = summarizeTransactions(items);
      return `
        <section class="month-group">
          <div class="row-line">
            <h3>${escapeHtml(formatMonth(month))}</h3>
            <span class="${summary.balance >= 0 ? "income" : "expense"}">${money.format(summary.balance)}</span>
          </div>
          ${items.map(renderTransaction).join("")}
        </section>
      `;
    })
    .join("");
}

function renderTransaction(transaction) {
  const sign = transaction.type === "income" ? "+" : "-";
  const title = transaction.description || transaction.category;
  return `
    <article class="transaction">
      <div class="transaction-title">
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(transaction.category)} · ${escapeHtml(formatDate(transaction.date))}</span>
      </div>
      <div class="amount ${transaction.type === "income" ? "income" : "expense"}">${sign}${money.format(transaction.amount)}</div>
      <button class="delete-button" type="button" data-delete-transaction="${escapeHtml(transaction.id)}">Apagar</button>
    </article>
  `;
}

function renderFixedExpenses() {
  if (!state.fixedExpenses.length) {
    els.fixedList.innerHTML = `<p class="empty">Guarda aqui despesas recorrentes como renda, seguros, mensalidades ou subscrições.</p>`;
    return;
  }

  els.fixedList.innerHTML = [...state.fixedExpenses]
    .sort((a, b) => a.day - b.day || a.name.localeCompare(b.name, "pt-PT"))
    .map(
      (item) => `
        <article class="fixed-item">
          <div class="row-line">
            <strong>${escapeHtml(item.name)}</strong>
            <span>${money.format(item.amount)}</span>
          </div>
          <p>${escapeHtml(item.category)} · dia ${item.day}</p>
          <div class="fixed-actions">
            <button class="use-button" type="button" data-use-fixed="${escapeHtml(item.id)}">Usar agora</button>
            <button class="delete-button" type="button" data-delete-fixed="${escapeHtml(item.id)}">Apagar</button>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderNetWorth() {
  const items = [...state.netWorth].sort((a, b) => a.date.localeCompare(b.date));
  const latest = items.at(-1);
  const previous = items.at(-2);
  const change = latest && previous ? latest.amount - previous.amount : 0;

  els.netWorthTotal.textContent = money.format(latest ? latest.amount : 0);
  els.netWorthChange.textContent = formatDelta(change);
  els.netWorthChange.className = change >= 0 ? "income" : "expense";
  els.netWorthCount.textContent = String(items.length);

  if (!items.length) {
    els.netWorthList.innerHTML = `<p class="empty">Regista o valor total das tuas poupanças e investimentos para veres a evolução.</p>`;
    return;
  }

  els.netWorthList.innerHTML = [...items]
    .reverse()
    .map(
      (item) => `
        <article class="simple-item">
          <div class="row-line">
            <strong>${money.format(item.amount)}</strong>
            <span>${escapeHtml(formatDate(item.date))}</span>
          </div>
          ${item.note ? `<p>${escapeHtml(item.note)}</p>` : ""}
          <div class="item-actions">
            <button class="delete-button" type="button" data-delete-worth="${escapeHtml(item.id)}">Apagar</button>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderSimulator() {
  const result = simulateInvestment();
  els.simFinal.textContent = money.format(result.finalValue);
  els.simInvested.textContent = money.format(result.invested);
  els.simInterest.textContent = money.format(result.finalValue - result.invested);
  els.simInterest.className = result.finalValue >= result.invested ? "income" : "expense";
  drawInvestmentChart(result.points);
}

function populateFixedCategorySelect() {
  const categories = getCategories("expense");
  els.fixedCategory.innerHTML = categories
    .map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
    .join("");
}

function renderFixedPresetSelect() {
  els.fixedPresetSelect.innerHTML = [
    `<option value="">Escolher modelo guardado</option>`,
    ...state.fixedExpenses
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "pt-PT"))
      .map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)} · ${money.format(item.amount)}</option>`),
  ].join("");
}

function buildInsights(current, previous, monthTransactions, fixedMonthly) {
  if (!monthTransactions.length) {
    return [
      {
        badge: "1",
        title: "Primeiro registo",
        text: "Começa por uma despesa do dia. O resumo mensal fica útil assim que houver movimentos.",
      },
    ];
  }

  const insights = [];
  const savingsRate = current.income > 0 ? Math.round((current.balance / current.income) * 100) : 0;
  const categoryTotals = {};

  monthTransactions.forEach((transaction) => {
    if (transaction.type !== "expense") return;
    categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + transaction.amount;
  });

  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

  if (current.balance < 0) {
    insights.push({
      badge: "!",
      title: "Saldo negativo",
      text: "As despesas já estão acima das receitas neste mês.",
    });
  } else if (current.income > 0) {
    insights.push({
      badge: "%",
      title: "Taxa de poupança",
      text: `Estás a guardar cerca de ${savingsRate}% das receitas do mês.`,
    });
  }

  if (topCategory && current.expense > 0) {
    const share = Math.round((topCategory[1] / current.expense) * 100);
    insights.push({
      badge: "#",
      title: "Maior categoria",
      text: `${topCategory[0]} representa ${share}% das despesas registadas.`,
    });
  }

  if (previous.expense > 0) {
    const diff = current.expense - previous.expense;
    const percent = Math.round((diff / previous.expense) * 100);
    if (Math.abs(percent) >= 10) {
      insights.push({
        badge: "↕",
        title: "Variação de despesas",
        text: `As despesas estão ${percent > 0 ? "acima" : "abaixo"} do mês anterior em ${Math.abs(percent)}%.`,
      });
    }
  }

  if (fixedMonthly > 0) {
    insights.push({
      badge: "F",
      title: "Fixas mensais",
      text: `As despesas fixas guardadas somam ${money.format(fixedMonthly)} por mês.`,
    });
  }

  return insights.slice(0, 3);
}

function renderChartsSoon() {
  requestAnimationFrame(() => {
    drawMonthlyChart();
    drawNetWorthChart();
    drawInvestmentChart(simulateInvestment().points);
  });
}

function drawMonthlyChart() {
  const months = Array.from({ length: 6 }, (_, index) => addMonths(selectedMonth, index - 5));
  const data = months.map((month) => summarizeTransactions(transactionsForMonth(month)));
  const labels = months.map((month) => shortMonthFormatter.format(new Date(`${month}-01T12:00:00`)));
  const styles = getStyles();

  drawLineChart(els.monthlyChart, labels, [
    {
      label: "Saldo",
      values: data.map((item) => item.balance),
      color: styles.amber,
      fill: true,
    },
    {
      label: "Receitas",
      values: data.map((item) => item.income),
      color: styles.success,
    },
    {
      label: "Despesas",
      values: data.map((item) => item.expense),
      color: styles.danger,
    },
  ]);
}

function drawNetWorthChart() {
  const items = [...state.netWorth].sort((a, b) => a.date.localeCompare(b.date));
  const styles = getStyles();

  drawLineChart(els.netWorthChart, items.map((item) => shortDateLabel(item.date)), [
    {
      label: "Património",
      values: items.map((item) => item.amount),
      color: styles.success,
      fill: true,
    },
  ]);
}

function drawInvestmentChart(points) {
  const styles = getStyles();
  drawLineChart(els.investmentChart, points.map((point) => String(point.year)), [
    {
      label: "Valor",
      values: points.map((point) => point.value),
      color: styles.success,
      fill: true,
    },
    {
      label: "Investido",
      values: points.map((point) => point.invested),
      color: styles.blue,
    },
  ]);
}

function drawLineChart(canvas, labels, datasets) {
  const ctxData = prepareCanvas(canvas);
  if (!ctxData) return;

  const { ctx, width, height } = ctxData;
  const styles = getStyles();
  const allValues = datasets.flatMap((dataset) => dataset.values).filter(Number.isFinite);
  const hasData = labels.length && allValues.length;
  const padding = { top: 14, right: 8, bottom: 28, left: 46 };
  const plotWidth = Math.max(1, width - padding.left - padding.right);
  const plotHeight = Math.max(1, height - padding.top - padding.bottom);

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = styles.surface;
  ctx.fillRect(0, 0, width, height);

  if (!hasData) {
    ctx.fillStyle = styles.muted;
    ctx.font = "700 13px system-ui, sans-serif";
    ctx.fillText("Sem dados suficientes", 12, 28);
    return;
  }

  let min = Math.min(...allValues, 0);
  let max = Math.max(...allValues, 0);
  if (min === max) {
    max += 1;
    min -= 1;
  }

  const range = max - min;
  const x = (index) => padding.left + (labels.length === 1 ? plotWidth / 2 : (index / (labels.length - 1)) * plotWidth);
  const y = (value) => padding.top + (1 - (value - min) / range) * plotHeight;

  ctx.strokeStyle = styles.grid;
  ctx.lineWidth = 1;
  ctx.fillStyle = styles.muted;
  ctx.font = "700 10px system-ui, sans-serif";

  for (let i = 0; i <= 3; i += 1) {
    const value = min + (range / 3) * i;
    const yy = y(value);
    ctx.beginPath();
    ctx.moveTo(padding.left, yy);
    ctx.lineTo(width - padding.right, yy);
    ctx.stroke();
    ctx.fillText(compactMoney.format(value), 0, yy + 3);
  }

  const maxLabels = width < 360 ? 3 : 6;
  const labelStep = Math.max(1, Math.ceil(labels.length / maxLabels));
  labels.forEach((label, index) => {
    if (index % labelStep !== 0 && index !== labels.length - 1) return;
    ctx.fillStyle = styles.muted;
    ctx.fillText(label, Math.min(x(index), width - 28), height - 8);
  });

  datasets.forEach((dataset) => {
    if (!dataset.values.length) return;

    ctx.beginPath();
    dataset.values.forEach((value, index) => {
      const xx = x(index);
      const yy = y(value);
      if (index === 0) ctx.moveTo(xx, yy);
      else ctx.lineTo(xx, yy);
    });

    ctx.strokeStyle = dataset.color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();

    if (dataset.fill) {
      ctx.lineTo(x(dataset.values.length - 1), y(0));
      ctx.lineTo(x(0), y(0));
      ctx.closePath();
      const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
      gradient.addColorStop(0, `${dataset.color}55`);
      gradient.addColorStop(1, `${dataset.color}05`);
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    dataset.values.forEach((value, index) => {
      ctx.beginPath();
      ctx.arc(x(index), y(value), 3, 0, Math.PI * 2);
      ctx.fillStyle = dataset.color;
      ctx.fill();
    });
  });
}

function prepareCanvas(canvas) {
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 20 || rect.height < 20) return null;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.round(rect.width);
  const height = Math.round(rect.height);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width, height };
}

function simulateInvestment() {
  const initial = Math.max(0, parseAmount(els.simInitial.value) || 0);
  const contribution = Math.max(0, parseAmount(els.simContribution.value) || 0);
  const years = clamp(Number(els.simYears.value || 1), 1, 50);
  const annualReturn = (parseAmount(els.simReturn.value) || 0) / 100;
  const monthlyRate = Math.pow(1 + annualReturn, 1 / 12) - 1;
  const monthlyContribution = contributionToMonthly(contribution, els.simFrequency.value);
  const points = [{ year: 0, value: initial, invested: initial }];
  let value = initial;
  let invested = initial;

  for (let month = 1; month <= years * 12; month += 1) {
    value = value * (1 + monthlyRate) + monthlyContribution;
    invested += monthlyContribution;

    if (month % 12 === 0) {
      points.push({
        year: month / 12,
        value,
        invested,
      });
    }
  }

  return {
    finalValue: value,
    invested,
    points,
  };
}

function contributionToMonthly(contribution, frequency) {
  const multipliers = {
    daily: 365 / 12,
    weekly: 52 / 12,
    monthly: 1,
    yearly: 1 / 12,
  };
  return contribution * (multipliers[frequency] || 1);
}

function transactionsForMonth(monthKey) {
  return state.transactions.filter((transaction) => transaction.date.slice(0, 7) === monthKey);
}

function summarizeTransactions(transactions) {
  const income = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const expense = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return {
    income,
    expense,
    balance: income - expense,
  };
}

function getCategories(type, settingsOverride = state.settings) {
  const defaults = type === "income" ? incomeCategories : expenseCategories;
  const custom =
    type === "income"
      ? settingsOverride.customIncomeCategories || []
      : settingsOverride.customExpenseCategories || [];
  const existing = state.transactions
    .filter((transaction) => transaction.type === type)
    .map((transaction) => transaction.category);
  const fixed = type === "expense" ? state.fixedExpenses.map((item) => item.category) : [];
  return [...new Set([...defaults, ...custom, ...existing, ...fixed])].sort((a, b) => a.localeCompare(b, "pt-PT"));
}

function saveAndRender() {
  saveState();
  render();
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || structuredClone(defaultData);
  } catch {
    return structuredClone(defaultData);
  }
}

function normalizeData(data) {
  const source = data && typeof data === "object" ? data : {};
  const transactions = Array.isArray(source.transactions)
    ? source.transactions
    : Array.isArray(source.movements)
      ? source.movements
      : [];

  return {
    version: 2,
    transactions: transactions.map((item) => ({
      id: item.id || createId(),
      type: item.type === "income" ? "income" : "expense",
      amount: Number(item.amount) || 0,
      category: item.category || "Outros",
      description: item.description || "",
      date: item.date || todayKey(),
      fixedId: item.fixedId || null,
      createdAt: item.createdAt || new Date().toISOString(),
    })),
    fixedExpenses: Array.isArray(source.fixedExpenses)
      ? source.fixedExpenses.map((item) => ({
          id: item.id || createId(),
          name: item.name || item.description || "Despesa fixa",
          amount: Number(item.amount) || 0,
          category: item.category || "Casa",
          day: clamp(Number(item.day || 1), 1, 31),
          createdAt: item.createdAt || new Date().toISOString(),
        }))
      : [],
    netWorth: Array.isArray(source.netWorth)
      ? source.netWorth.map((item) => ({
          id: item.id || createId(),
          amount: Number(item.amount) || 0,
          date: item.date || todayKey(),
          note: item.note || "",
          createdAt: item.createdAt || new Date().toISOString(),
        }))
      : [],
    settings: {
      theme: source.settings?.theme === "light" ? "light" : "dark",
      appTitle: source.settings?.appTitle || "Farol",
      appSubtitle: source.settings?.appSubtitle || "Finan\u00e7as pessoais",
      logoDataUrl: source.settings?.logoDataUrl || "",
      customExpenseCategories: sanitizeCategoryList(source.settings?.customExpenseCategories),
      customIncomeCategories: sanitizeCategoryList(source.settings?.customIncomeCategories),
    },
  };
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `farol-financas-${todayKey()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importData() {
  const file = els.importInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      state = normalizeData(JSON.parse(String(reader.result)));
      selectedMonth = currentMonthKey();
      els.monthPicker.value = selectedMonth;
      saveAndRender();
    } catch {
      window.alert("Não foi possível importar este ficheiro.");
    }
  };
  reader.readAsText(file);
  els.importInput.value = "";
}

function applyTheme() {
  document.documentElement.dataset.theme = state.settings.theme;
  els.themeBtn.setAttribute("aria-label", state.settings.theme === "light" ? "Ativar modo escuro" : "Ativar modo claro");
}

function getStyles() {
  const styles = getComputedStyle(document.documentElement);
  return {
    surface: styles.getPropertyValue("--surface").trim(),
    grid: styles.getPropertyValue("--border").trim(),
    muted: styles.getPropertyValue("--muted").trim(),
    success: styles.getPropertyValue("--success").trim(),
    danger: styles.getPropertyValue("--danger").trim(),
    amber: styles.getPropertyValue("--amber").trim(),
    blue: styles.getPropertyValue("--blue").trim(),
  };
}

function groupBy(items, getKey) {
  return items.reduce((groups, item) => {
    const key = getKey(item);
    groups[key] = groups[key] || [];
    groups[key].push(item);
    return groups;
  }, {});
}

function addMonths(monthKey, offset) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1 + offset, 1, 12, 0, 0);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function dateForFixedDay(day) {
  const [year, month] = selectedMonth.split("-").map(Number);
  const maxDay = new Date(year, month, 0).getDate();
  const safeDay = clamp(Number(day), 1, maxDay);
  return `${selectedMonth}-${String(safeDay).padStart(2, "0")}`;
}

function todayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function currentMonthKey() {
  return todayKey().slice(0, 7);
}

function formatMonth(monthKey) {
  return monthFormatter.format(new Date(`${monthKey}-01T12:00:00`));
}

function formatDate(dateKey) {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${dateKey}T12:00:00`));
}

function shortDateLabel(dateKey) {
  return new Intl.DateTimeFormat("pt-PT", {
    month: "short",
    day: "2-digit",
  }).format(new Date(`${dateKey}T12:00:00`));
}

function parseAmount(value) {
  const clean = String(value || "")
    .trim()
    .replaceAll("€", "")
    .replace(/\s/g, "");

  if (!clean) return 0;

  const normalized = clean.includes(",")
    ? clean.replace(/\./g, "").replace(",", ".")
    : clean;

  return Number(normalized);
}

function formatInputAmount(value) {
  return new Intl.NumberFormat("pt-PT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDelta(value) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${money.format(value)}`;
}

function sanitizeCategoryList(categories) {
  if (!Array.isArray(categories)) return [];
  return [...new Set(categories.map((category) => String(category).trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "pt-PT"),
  );
}

function createId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
