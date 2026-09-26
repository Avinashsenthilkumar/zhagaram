import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { LogoSpinner } from "@/components/common/LogoSpinner";
import { compressImageFile, formatBytes } from "@/lib/image-compress";
import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { Boxes, LayoutDashboard, PackagePlus, Pencil, Plus, ShieldCheck, Star, Trash2, X } from "lucide-react";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { apiResourceUrl, apiUrl } from "@/lib/api-url";

export const Route = createFileRoute("/admin")({ component: AdminDashboard });

type User = { id: string; email: string; name: string | null; role: string };
type Category = { id: string; name: string; slug: string; description: string | null; image: string | null };
type Product = { id: string; name: string; slug: string; categoryId: string | null; shortDescription: string | null; description: string | null; images: string[]; features: string[]; status: string; image: string | null };
type DashboardStats = { categories: number; products: number; reviews: number; approvedReviews: number; declinedReviews: number; pendingReviews: number };
type ApiResult<T> = { success: boolean; data?: T; message?: string };

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  // `...options` first: spreading it last re-applied `options.headers` over the
  // merged object and dropped the Content-Type set here.
  const response = await fetch(apiUrl(path), { ...options, credentials: "include", headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) } });
  const result = (await response.json()) as ApiResult<T>;
  if (!response.ok || !result.success) throw new Error(result.message || "Request failed.");
  return result.data as T;
}

const emptyCategory = { name: "", slug: "", description: "", imageData: "", imageMimeType: "" };
const emptyProduct = { name: "", slug: "", categoryId: "", shortDescription: "", description: "", images: "", features: "", imageData: "", imageMimeType: "" };
const PAGE_SIZE = 6;

function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminSubPage = location.pathname.startsWith("/admin/");
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [section, setSection] = useState<"overview" | "categories" | "products">("overview");
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [categoryModal, setCategoryModal] = useState(false);
  const [productModal, setProductModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function loadDashboard(showSpinner = false) {
    if (showSpinner) setIsRefreshing(true);
    try {
      const [dashboard, categoryItems, productItems] = await Promise.all([
        api<DashboardStats>("/api/admin/dashboard"),
        api<Category[]>("/api/admin/categories"),
        api<Product[]>("/api/admin/products"),
      ]);
      setStats(dashboard); setCategories(categoryItems.map((item) => ({ ...item, image: apiResourceUrl(item.image) }))); setProducts(productItems.map((item) => ({ ...item, image: apiResourceUrl(item.image) })));
    } finally { if (showSpinner) setIsRefreshing(false); }
  }

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const session = await api<{ user: User }>("/api/auth/me");
        if (session.user.role !== "ADMIN") { if (active) await navigate({ to: "/403" }); return; }
        if (!active) return;
        setUser(session.user);
        await loadDashboard();
      } catch { if (active) await navigate({ to: "/login" }); }
      finally { if (active) setIsLoading(false); }
    })();
    return () => { active = false; };
  }, [navigate]);

  async function runMutation(action: () => Promise<void>, successMessage: string) {
    setError(""); setNotice(""); setIsSaving(true);
    try { await action(); await loadDashboard(); setNotice(successMessage); }
    catch (mutationError) { setError(mutationError instanceof Error ? mutationError.message : "Unable to save changes."); }
    finally { setIsSaving(false); }
  }

  function submitCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runMutation(async () => {
      const payload = editingCategoryId
        ? { name: categoryForm.name, slug: categoryForm.slug, description: categoryForm.description, ...(categoryForm.imageData ? { imageData: categoryForm.imageData, imageMimeType: categoryForm.imageMimeType } : {}) }
        : categoryForm;
      await api<Category>(editingCategoryId ? `/api/admin/categories/${editingCategoryId}` : "/api/admin/categories", { method: editingCategoryId ? "PATCH" : "POST", body: JSON.stringify(payload) });
      resetCategory();
    }, editingCategoryId ? "Category updated." : "Category created. Footer category menu will update automatically.");
  }

  function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runMutation(async () => {
      const payload = { name: productForm.name, slug: productForm.slug, categoryId: productForm.categoryId || null, shortDescription: productForm.shortDescription, description: productForm.description, images: splitValues(productForm.images), features: splitValues(productForm.features), ...(productForm.imageData ? { imageData: productForm.imageData, imageMimeType: productForm.imageMimeType } : {}) };
      await api<Product>(editingProductId ? `/api/admin/products/${editingProductId}` : "/api/admin/products", { method: editingProductId ? "PATCH" : "POST", body: JSON.stringify(editingProductId ? payload : { ...payload, imageData: productForm.imageData || null, imageMimeType: productForm.imageMimeType || null }) });
      resetProduct();
    }, editingProductId ? "Product updated." : "Product created.");
  }

  async function remove(path: string, label: string) {
    if (!window.confirm(`Delete this ${label}?`)) return;
    void runMutation(() => api(path, { method: "DELETE" }).then(() => undefined), `${label[0].toUpperCase()}${label.slice(1)} deleted.`);
  }

  async function signOut() { await fetch(apiUrl("/api/auth/logout"), { method: "POST", credentials: "include" }); await navigate({ to: "/login" }); }
  function resetCategory() { setCategoryForm(emptyCategory); setEditingCategoryId(null); setCategoryModal(false); }
  function resetProduct() { setProductForm(emptyProduct); setEditingProductId(null); setProductModal(false); }
  function newCategory() { resetCategory(); setCategoryModal(true); }
  function newProduct() { resetProduct(); setProductModal(true); }
  function editCategory(category: Category) { setEditingCategoryId(category.id); setCategoryForm({ name: category.name, slug: category.slug, description: category.description || "", imageData: "", imageMimeType: "" }); setCategoryModal(true); }
  function editProduct(product: Product) { const imageData = product.image?.startsWith("data:") ? product.image : ""; setEditingProductId(product.id); setProductForm({ name: product.name, slug: product.slug, categoryId: product.categoryId || "", shortDescription: product.shortDescription || "", description: product.description || "", images: product.images.join(", "), features: product.features.join(", "), imageData, imageMimeType: mimeFromDataUrl(imageData) }); setProductModal(true); }

  if (isLoading)
    return (
      <div className="grid min-h-screen place-items-center bg-[#f4f6f1]">
        <div className="flex flex-col items-center gap-4">
          <LogoSpinner size="lg" label="Loading dashboard" />
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Loading dashboard
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f4f6f1] text-[#18352a]">
      <AdminHeader email={user?.email} refreshing={isRefreshing} onRefresh={() => void loadDashboard(true)} onSignOut={() => void signOut()} />
      <aside className="fixed inset-y-16 left-0 z-40 hidden w-64 border-r border-[#1f5a40] bg-[#123d2b] p-4 text-white lg:block">
        <div className="border-b border-white/15 px-3 pb-5"><div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck size={17} /> Owner Console</div><p className="mt-2 truncate text-xs text-white/60">{user?.email}</p></div>
        <nav className="mt-4 space-y-1">
          <SidebarButton active={!isAdminSubPage && section === "overview"} icon={<LayoutDashboard size={17} />} onClick={() => { setSection("overview"); void navigate({ to: "/admin" }); }}>Overview</SidebarButton>
          <SidebarButton active={!isAdminSubPage && section === "categories"} icon={<Boxes size={17} />} onClick={() => { setSection("categories"); void navigate({ to: "/admin" }); }}>Categories</SidebarButton>
          <SidebarButton active={!isAdminSubPage && section === "products"} icon={<PackagePlus size={17} />} onClick={() => { setSection("products"); void navigate({ to: "/admin" }); }}>Products</SidebarButton>
          <Link to="/admin/reviews" className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition ${isAdminSubPage ? "bg-white text-[#123d2b]" : "text-white/75 hover:bg-white/10 hover:text-white"}`}><Star size={17} /> Reviews</Link>
        </nav>
      </aside>

      <div className="border-b border-[#dbe5dc] bg-[#123d2b] px-4 py-2 lg:hidden">
        <div className="flex gap-2 overflow-x-auto">
          <MobileNav active={!isAdminSubPage && section === "overview"} onClick={() => { setSection("overview"); void navigate({ to: "/admin" }); }}>Overview</MobileNav>
          <MobileNav active={!isAdminSubPage && section === "categories"} onClick={() => { setSection("categories"); void navigate({ to: "/admin" }); }}>Categories</MobileNav>
          <MobileNav active={!isAdminSubPage && section === "products"} onClick={() => { setSection("products"); void navigate({ to: "/admin" }); }}>Products</MobileNav>
          <Link to="/admin/reviews" className="shrink-0 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white">Reviews</Link>
        </div>
      </div>

      <main className="lg:pl-64">
        <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
          {isAdminSubPage ? <Outlet /> : <>
            <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9b7b18]">ZHAGARAM EXIM</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Catalog workspace</h1><p className="mt-1 text-sm text-slate-600">Manage the products your customers see.</p></div>
              <div className="flex flex-wrap gap-2"><button type="button" onClick={newCategory} className="inline-flex items-center gap-2 rounded-lg bg-[#123d2b] px-4 py-2.5 text-sm font-semibold text-white"><Plus size={16} /> New category</button><button type="button" onClick={newProduct} className="inline-flex items-center gap-2 rounded-lg border border-[#c9d8cc] bg-white px-4 py-2.5 text-sm font-semibold text-[#123d2b]"><Plus size={16} /> New product</button></div>
            </header>
            {notice ? <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p> : null}
            {error ? <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}
            {section === "overview" ? <Overview stats={stats} onNavigate={setSection} /> : null}
            {section === "categories" ? <CategoriesSection categories={categories} onNew={newCategory} onEdit={editCategory} onDelete={(id) => void remove(`/api/admin/categories/${id}`, "category")} /> : null}
            {section === "products" ? <ProductsSection categories={categories} products={products} onNew={newProduct} onEdit={editProduct} onDelete={(id) => void remove(`/api/admin/products/${id}`, "product")} /> : null}
          </>}
        </div>
      </main>

      {categoryModal ? <Modal title={editingCategoryId ? "Edit category" : "Create category"} onClose={resetCategory}><form className="space-y-4" onSubmit={submitCategory}><TextField label="Name" value={categoryForm.name} onChange={(value) => setCategoryForm({ ...categoryForm, name: value })} required /><TextField label="Slug" value={categoryForm.slug} onChange={(value) => setCategoryForm({ ...categoryForm, slug: value })} required /><TextArea label="Description" value={categoryForm.description} onChange={(value) => setCategoryForm({ ...categoryForm, description: value })} /><ImageField label="Category image" value={categoryForm.imageData} existingUrl={editingCategoryId ? (categories.find((c) => c.id === editingCategoryId)?.image ?? null) : null} onChange={(imageData, imageMimeType) => setCategoryForm({ ...categoryForm, imageData, imageMimeType })} /><div className="flex justify-end gap-3 pt-2"><button type="button" onClick={resetCategory} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold">Cancel</button><SubmitButton disabled={isSaving}>{editingCategoryId ? "Save category" : "Create category"}</SubmitButton></div></form></Modal> : null}
      {productModal ? <Modal title={editingProductId ? "Edit product" : "Create product"} onClose={resetProduct}><form className="grid gap-4 sm:grid-cols-2" onSubmit={submitProduct}><TextField label="Product name" value={productForm.name} onChange={(value) => setProductForm({ ...productForm, name: value })} required /><TextField label="Slug" value={productForm.slug} onChange={(value) => setProductForm({ ...productForm, slug: value })} required /><SelectField label="Category" value={productForm.categoryId} onChange={(value) => setProductForm({ ...productForm, categoryId: value })} options={categories.map((category) => [category.id, category.name])} /><TextField label="Short description" value={productForm.shortDescription} onChange={(value) => setProductForm({ ...productForm, shortDescription: value })} /><div className="sm:col-span-2"><TextArea label="Description" value={productForm.description} onChange={(value) => setProductForm({ ...productForm, description: value })} /></div><ImageField label="Product image" value={productForm.imageData} existingUrl={editingProductId ? (products.find((p) => p.id === editingProductId)?.image ?? null) : null} onChange={(imageData, imageMimeType) => setProductForm({ ...productForm, imageData, imageMimeType })} /><TextField label="Features (comma separated)" value={productForm.features} onChange={(value) => setProductForm({ ...productForm, features: value })} /><div className="sm:col-span-2 flex justify-end gap-3 pt-2"><button type="button" onClick={resetProduct} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold">Cancel</button><SubmitButton disabled={isSaving}>{editingProductId ? "Save product" : "Create product"}</SubmitButton></div></form></Modal> : null}
    </div>
  );
}

function SidebarButton({ active, icon, children, onClick }: { active: boolean; icon: ReactNode; children: ReactNode; onClick: () => void }) { return <button type="button" onClick={onClick} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition ${active ? "bg-white text-[#123d2b]" : "text-white/75 hover:bg-white/10 hover:text-white"}`}>{icon}{children}</button>; }
function MobileNav({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) { return <button type="button" onClick={onClick} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold ${active ? "bg-white text-[#123d2b]" : "text-white/75"}`}>{children}</button>; }

function Overview({ stats, onNavigate }: { stats: DashboardStats | null; onNavigate: (section: "categories" | "products") => void }) {
  const cards = [["Categories", stats?.categories ?? 0, "categories"], ["Products", stats?.products ?? 0, "products"], ["Pending reviews", stats?.pendingReviews ?? 0, null], ["Approved reviews", stats?.approvedReviews ?? 0, null]] as const;
  return <div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, target]) => target ? <button key={label} type="button" onClick={() => onNavigate(target)} className="rounded-xl border border-[#dbe5dc] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5"><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-3xl font-semibold text-[#123d2b]">{value}</p></button> : <Link key={label} to="/admin/reviews" className="rounded-xl border border-[#dbe5dc] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5"><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-3xl font-semibold text-[#123d2b]">{value}</p></Link>)}</div><div className="mt-6 rounded-2xl border border-[#dbe5dc] bg-white p-6"><h2 className="text-xl font-semibold">Quick actions</h2><p className="mt-2 text-sm text-slate-600">Create or update catalog data. Approved reviews are displayed on the public website.</p></div></div>;
}

function CategoriesSection({ categories, onNew, onEdit, onDelete }: { categories: Category[]; onNew: () => void; onEdit: (category: Category) => void; onDelete: (id: string) => void }) {
  const [page, setPage] = useState(1); const pages = Math.max(1, Math.ceil(categories.length / PAGE_SIZE)); const visible = useMemo(() => categories.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [categories, page]);
  useEffect(() => { if (page > pages) setPage(pages); }, [page, pages]);
  return <section className="rounded-2xl border border-[#dbe5dc] bg-white p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">Categories</h2><p className="mt-1 text-sm text-slate-500">{categories.length} total categories</p></div><button type="button" onClick={onNew} className="inline-flex items-center gap-2 rounded-lg bg-[#123d2b] px-4 py-2.5 text-sm font-semibold text-white"><Plus size={16} /> Add category</button></div><div className="mt-5 divide-y divide-slate-100">{visible.map((category) => <div className="flex items-center gap-3 py-4" key={category.id}>{category.image ? <img loading="lazy" decoding="async" src={category.image} alt="" className="size-14 shrink-0 rounded-lg object-cover" /> : <div className="size-14 shrink-0 rounded-lg bg-[#edf4ee]" />}<div className="min-w-0 flex-1"><p className="font-semibold text-[#123d2b]">{category.name}</p><p className="truncate text-xs text-slate-500">/{category.slug}</p></div><button type="button" onClick={() => onEdit(category)} className="rounded-md p-2 text-slate-400 hover:bg-[#edf4ee] hover:text-[#075333]"><Pencil size={16} /></button><button type="button" onClick={() => onDelete(category.id)} className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-700"><Trash2 size={16} /></button></div>)}</div><Pagination page={page} pages={pages} onPage={setPage} /></section>;
}

function ProductsSection({
  categories,
  products,
  onNew,
  onEdit,
  onDelete,
}: {
  categories: Category[];
  products: Product[];
  onNew: () => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}) {
  const [page, setPage] = useState(1);

  const pages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));

  const visible = useMemo(
    () =>
      products.slice(
        (page - 1) * PAGE_SIZE,
        page * PAGE_SIZE
      ),
    [products, page]
  );

  useEffect(() => {
    if (page > pages) {
      setPage(pages);
    }
  }, [page, pages]);

  const categoryMap = new Map(
    categories.map((category) => [category.id, category.name])
  );

  return (
    <section className="rounded-2xl border border-[#dbe5dc] bg-white p-5 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Products</h2>
          <p className="mt-1 text-sm text-slate-500">
            {products.length} total products
          </p>
        </div>

        <button
          type="button"
          onClick={onNew}
          className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#123d2b] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0d3022]"
        >
          <Plus size={16} />
          Add product
        </button>
      </div>

      {/* Product List */}
      <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
        {/* Desktop Header */}
        <div className="hidden grid-cols-[64px_1.5fr_1fr_1.5fr_120px] items-center gap-4 bg-[#f5f8f5] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
          <div>Image</div>
          <div>Product</div>
          <div>Category</div>
          <div>Slug</div>
          <div className="text-right">Actions</div>
        </div>

        {visible.length > 0 ? (
          visible.map((product) => (
            <div
              key={product.id}
              className="border-t border-slate-200 px-4 py-4 first:border-t-0"
            >
              {/* Desktop */}
              <div className="hidden grid-cols-[64px_1.5fr_1fr_1.5fr_120px] items-center gap-4 md:grid">
                {/* Image */}
                <div className="h-12 w-12 overflow-hidden rounded-lg border border-slate-200 bg-[#edf4ee]">
                  {product.image ? (
                    <img
                      loading="lazy"
                      decoding="async"
                      src={apiResourceUrl(product.image) ?? ""}
  alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-[#edf4ee]" />
                  )}
                </div>

                {/* Product */}
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[#123d2b]">
                    {product.name}
                  </p>
                </div>

                {/* Category */}
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-600">
                    {categoryMap.get(product.categoryId || "") ||
                      "Uncategorized"}
                  </p>
                </div>

                {/* Slug */}
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-400">
                    /{product.slug}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(product)}
                    aria-label={`Edit ${product.name}`}
                    className="rounded-md p-2 text-slate-400 transition hover:bg-[#edf4ee] hover:text-[#075333]"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(product.id)}
                    aria-label={`Delete ${product.name}`}
                    className="rounded-md p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Mobile / Tablet */}
              <div className="flex items-center gap-3 md:hidden">
                {/* Image */}
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-[#edf4ee]">
                  {product.image ? (
                    <img
                      loading="lazy"
                      decoding="async"
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-[#edf4ee]" />
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-[#123d2b]">
                    {product.name}
                  </p>

                  <p className="mt-1 truncate text-xs text-slate-500">
                    {categoryMap.get(product.categoryId || "") ||
                      "Uncategorized"}
                  </p>

                  <p className="mt-1 truncate text-xs text-slate-400">
                    /{product.slug}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(product)}
                    aria-label={`Edit ${product.name}`}
                    className="rounded-md p-2 text-slate-400 transition hover:bg-[#edf4ee] hover:text-[#075333]"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(product.id)}
                    aria-label={`Delete ${product.name}`}
                    className="rounded-md p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-500">
              No products found
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Add your first product to get started.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {products.length > 0 && (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-medium text-slate-700">
              {(page - 1) * PAGE_SIZE + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium text-slate-700">
              {Math.min(page * PAGE_SIZE, products.length)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-slate-700">
              {products.length}
            </span>{" "}
            products
          </p>

          <Pagination
            page={page}
            pages={pages}
            onPage={setPage}
          />
        </div>
      )}
    </section>
  );
}



function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (page: number) => void }) { if (pages <= 1) return null; return <div className="mt-6 flex items-center justify-center gap-2"><button type="button" disabled={page === 1} onClick={() => onPage(page - 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-40">Previous</button><span className="px-3 text-sm text-slate-500">Page {page} of {pages}</span><button type="button" disabled={page === pages} onClick={() => onPage(page + 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-40">Next</button></div>; }

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) { return <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true"><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"><div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4 sm:px-6"><h2 className="text-lg font-semibold text-[#123d2b]">{title}</h2><button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button></div><div className="p-5 sm:p-6">{children}</div></div></div>; }
function TextField({ label, value, onChange, required = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) { return <label className="block text-sm font-medium text-slate-700">{label}<input required={required} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-[#075333] focus:ring-2 focus:ring-[#075333]/15" /></label>; }
function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block text-sm font-medium text-slate-700">{label}<textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-[#075333] focus:ring-2 focus:ring-[#075333]/15" /></label>; }
function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) { return <label className="block text-sm font-medium text-slate-700">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"><option value="">Select category</option>{options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>; }
function SubmitButton({ disabled, children }: { disabled?: boolean; children: ReactNode }) { return <button type="submit" disabled={disabled} className="rounded-lg bg-[#075333] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60">{children}</button>; }
function ImageField({
  label,
  value,
  existingUrl,
  onChange,
}: {
  label: string;
  value: string;
  existingUrl?: string | null;
  onChange: (imageData: string, imageMimeType: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [problem, setProblem] = useState("");

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setProblem("");
    setNote("");

    try {
      // PERF: resize + re-encode in the browser. A 4 MB phone photo becomes
      // roughly 200 KB before it ever touches the network or the database.
      const result = await compressImageFile(file);
      onChange(result.dataUrl, result.mimeType);

      if (result.compressedBytes < result.originalBytes) {
        const saved = Math.round(
          100 - (result.compressedBytes / result.originalBytes) * 100,
        );
        setNote(
          `Optimised ${formatBytes(result.originalBytes)} to ${formatBytes(result.compressedBytes)} (${saved}% smaller)`,
        );
      } else {
        setNote(`Ready to upload (${formatBytes(result.compressedBytes)})`);
      }
    } catch {
      setProblem("That image could not be read. Try a JPEG, PNG or WebP file.");
    } finally {
      setBusy(false);
    }
  }

  const preview = value || existingUrl || "";

  return (
    <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
      {label}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={busy}
        onChange={(event) => void handleFile(event)}
        className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:opacity-60"
      />

      {busy ? (
        <span className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-500">
          <LogoSpinner size="sm" label="Optimising image" />
          Optimising image...
        </span>
      ) : null}

      {note && !busy ? (
        <span className="mt-2 block text-xs font-medium text-emerald-600">{note}</span>
      ) : null}

      {problem ? (
        <span className="mt-2 block text-xs font-medium text-rose-600">{problem}</span>
      ) : null}

      {preview && !busy ? (
        <img
          src={preview}
          alt="Selected preview"
          loading="lazy"
          decoding="async"
          className="mt-3 h-24 w-36 rounded-lg object-cover"
        />
      ) : null}

      {!value && existingUrl ? (
        <span className="mt-2 block text-xs text-slate-500">
          Current image. Choose a file only if you want to replace it.
        </span>
      ) : null}
    </label>
  );
}
