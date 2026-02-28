import Link from "next/link";

export default function UniformShopPage() {
    const products = [
        {
            id: "uni-001",
            name: "Olabs Official Polo (Short Sleeve)",
            category: "Everyday Wear",
            price: "$25.00",
            sizes: ["S", "M", "L", "XL"],
            inStock: true,
        },
        {
            id: "uni-002",
            name: "Winter V-Neck Jumper",
            category: "Winter Wear",
            price: "$45.00",
            sizes: ["M", "L", "XL"],
            inStock: true,
        },
        {
            id: "uni-003",
            name: "PE Kit Bundle (T-Shirt & Shorts)",
            category: "Sports",
            price: "$35.00",
            sizes: ["S", "M", "L"],
            inStock: true,
        },
        {
            id: "uni-004",
            name: "School Blazer w/ Logo",
            category: "Formal Wear",
            price: "$85.00",
            sizes: ["L", "XL"],
            inStock: false,
        },
    ];

    return (
        <div className="bg-background flex flex-col items-center py-12 px-6">
            <header className="w-full max-w-4xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground tracking-tight">Uniform Shop</h1>
                    <p className="text-foreground/60 mt-1 font-medium">Order official Olabs apparel and accessories online.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <button className="px-4 py-2 bg-card text-foreground border border-border/30 font-medium rounded-lg hover:bg-border/50 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.42 10.922a2 2 0 0 1-.019 2.835l-8.58 8.59a2 2 0 0 1-2.828 0l-7.16-7.15a2 2 0 0 1 0-2.828l8.58-8.59a2 2 0 0 1 2.827 0l7.15 7.14Z" /><path d="M14 6h0" /></svg>
                        Track Orders
                    </button>
                    <button className="px-4 py-2 bg-red-accent text-white font-medium rounded-lg hover:opacity-90 flex items-center justify-center gap-2 w-full sm:w-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
                        Cart (0)
                    </button>
                </div>
            </header>

            <main className="w-full max-w-4xl space-y-8">
                {/* Categories / Filters */}
                <section className="flex gap-4 overflow-x-auto pb-2">
                    <button className="px-5 py-2 bg-red-accent/10 border border-red-accent/30 text-red-accent font-medium rounded-full whitespace-nowrap">All Items</button>
                    <button className="px-5 py-2 bg-card border border-border/30 text-foreground/80 hover:text-foreground font-medium rounded-full hover:bg-background/50 transition-colors whitespace-nowrap">Everyday Wear</button>
                    <button className="px-5 py-2 bg-card border border-border/30 text-foreground/80 hover:text-foreground font-medium rounded-full hover:bg-background/50 transition-colors whitespace-nowrap">Winter Wear</button>
                    <button className="px-5 py-2 bg-card border border-border/30 text-foreground/80 hover:text-foreground font-medium rounded-full hover:bg-background/50 transition-colors whitespace-nowrap">Sports & PE</button>
                </section>

                {/* Product Grid */}
                <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {products.map((item) => (
                        <div key={item.id} className="bg-card border border-border/30 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden">
                            {/* Image Placeholder */}
                            <div className="aspect-square bg-background/50 flex items-center justify-center border-b border-border/30 p-8">
                                <div className="text-6xl opacity-20">👕</div>
                            </div>

                            <div className="p-5 flex flex-col flex-grow">
                                <span className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-1">{item.category}</span>
                                <h3 className="font-semibold text-foreground text-lg leading-tight mb-2">{item.name}</h3>

                                <div className="mt-auto pt-4 flex items-end justify-between">
                                    <div>
                                        <span className="block text-xl font-bold text-foreground">{item.price}</span>
                                        <span className={`block text-xs font-medium mt-1 ${item.inStock ? 'text-green-600' : 'text-red-accent'}`}>
                                            {item.inStock ? 'In Stock' : 'Out of Stock'}
                                        </span>
                                    </div>
                                    <button
                                        disabled={!item.inStock}
                                        className={`p-2 rounded-md transition-colors ${item.inStock ? 'bg-orange-accent/10 text-orange-accent hover:bg-orange-accent/20' : 'bg-background text-foreground/30 cursor-not-allowed border border-border/30'}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </section>
            </main>
        </div>
    );
}
