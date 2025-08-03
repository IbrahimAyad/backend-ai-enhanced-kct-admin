import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Package, 
  Users, 
  ShoppingCart, 
  Star, 
  Crown,
  Database,
  FileText,
  Calendar,
  TrendingUp,
  X,
  Clock,
  Filter
} from 'lucide-react';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  icon: any;
  route: string;
  badge?: string;
}

const mockSearchData: SearchResult[] = [
  // Products
  { id: '1', title: 'Navy Blue Wedding Suit', subtitle: '$1,299.99', category: 'Products', icon: Package, route: '/admin/products' },
  { id: '2', title: 'Italian Leather Shoes', subtitle: '$399.99', category: 'Products', icon: Package, route: '/admin/products' },
  { id: '3', title: 'Silk Pocket Square', subtitle: '$89.99', category: 'Products', icon: Package, route: '/admin/products' },
  
  // Customers
  { id: '4', title: 'John Smith', subtitle: 'john@email.com', category: 'Customers', icon: Users, route: '/admin/customers' },
  { id: '5', title: 'Michael Johnson', subtitle: 'michael@email.com', category: 'Customers', icon: Users, route: '/admin/customers' },
  
  // Orders
  { id: '6', title: 'Order #ORD-001', subtitle: '$2,499.99 - Processing', category: 'Orders', icon: ShoppingCart, route: '/admin/orders', badge: 'New' },
  { id: '7', title: 'Order #ORD-002', subtitle: '$1,299.99 - Shipped', category: 'Orders', icon: ShoppingCart, route: '/admin/orders' },
  
  // Weddings
  { id: '8', title: 'Smith-Johnson Wedding', subtitle: 'June 15, 2024', category: 'Weddings', icon: Crown, route: '/admin/weddings' },
  { id: '9', title: 'Wilson-Brown Wedding', subtitle: 'July 20, 2024', category: 'Weddings', icon: Crown, route: '/admin/weddings' },
  
  // Reviews
  { id: '10', title: 'Excellent service and quality!', subtitle: '5 stars by John Smith', category: 'Reviews', icon: Star, route: '/admin/reviews' },
  
  // Analytics & Reports
  { id: '11', title: 'Revenue Report', subtitle: 'Monthly analytics', category: 'Reports', icon: TrendingUp, route: '/admin/reports' },
  { id: '12', title: 'Inventory Report', subtitle: 'Stock levels', category: 'Reports', icon: Database, route: '/admin/inventory' },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Navy Blue Suit',
    'John Smith',
    'Order #ORD-001'
  ]);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter results based on search term and category
  const filteredResults = mockSearchData.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.subtitle?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category.toLowerCase() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group results by category
  const groupedResults = filteredResults.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  // Handle search result selection
  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setSearchTerm('');
    
    // Add to recent searches
    const newRecentSearches = [result.title, ...recentSearches.filter(s => s !== result.title)].slice(0, 5);
    setRecentSearches(newRecentSearches);
    
    navigate(result.route);
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
  };

  // Categories for filtering
  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'products', label: 'Products' },
    { value: 'customers', label: 'Customers' },
    { value: 'orders', label: 'Orders' },
    { value: 'weddings', label: 'Weddings' },
    { value: 'reviews', label: 'Reviews' },
    { value: 'reports', label: 'Reports' },
  ];

  // Keyboard shortcut handling
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <div className="relative w-full max-w-md">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "relative w-full justify-start text-left font-normal",
              "h-9 px-3 text-sm",
              "bg-background hover:bg-accent/50",
              "border-border/40"
            )}
          >
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <span className="flex-1 truncate text-muted-foreground">
              Search everything...
            </span>
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[400px] p-0" 
          align="start"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
        >
          <Command className="rounded-lg border-0 shadow-md">
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput
                ref={inputRef}
                placeholder="Search products, customers, orders..."
                value={searchTerm}
                onValueChange={setSearchTerm}
                className="flex-1 border-0 px-0 py-3 text-sm outline-none placeholder:text-muted-foreground"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 border-b px-3 py-2">
              <Filter className="h-3 w-3 text-muted-foreground" />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-6 border-0 px-1 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.value} value={category.value} className="text-xs">
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <CommandList className="max-h-[300px] overflow-y-auto">
              {!searchTerm && recentSearches.length > 0 && (
                <>
                  <CommandGroup>
                    <div className="flex items-center justify-between px-2 py-1.5">
                      <span className="text-xs font-medium text-muted-foreground">Recent</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                        onClick={clearRecentSearches}
                      >
                        Clear
                      </Button>
                    </div>
                    {recentSearches.map((search, index) => (
                      <CommandItem
                        key={index}
                        onSelect={() => setSearchTerm(search)}
                        className="cursor-pointer"
                      >
                        <Clock className="mr-2 h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{search}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}

              {searchTerm && Object.keys(groupedResults).length === 0 && (
                <CommandEmpty>No results found for "{searchTerm}"</CommandEmpty>
              )}

              {Object.entries(groupedResults).map(([category, results]) => (
                <CommandGroup key={category} heading={category}>
                  {results.map((result) => {
                    const Icon = result.icon;
                    return (
                      <CommandItem
                        key={result.id}
                        onSelect={() => handleSelect(result)}
                        className="cursor-pointer"
                      >
                        <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{result.title}</span>
                            {result.badge && (
                              <Badge variant="secondary" className="h-4 px-1 text-xs">
                                {result.badge}
                              </Badge>
                            )}
                          </div>
                          {result.subtitle && (
                            <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                          )}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}