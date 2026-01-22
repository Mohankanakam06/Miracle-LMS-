import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLibraryBooks, useAddLibraryBook, useMyBorrowings, useBorrowBook } from '@/hooks/useEnhancedLMS';
import { useAuth } from '@/hooks/useAuth';
import { Book, Search, Plus, BookOpen, Clock, AlertCircle } from 'lucide-react';
import { format, addDays, isPast } from 'date-fns';
import { cn } from '@/lib/utils';

const CATEGORIES = ['Fiction', 'Non-Fiction', 'Science', 'Technology', 'Engineering', 'Mathematics', 'Reference', 'Magazines'];

export default function Library() {
  const { user, userRole } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<string>('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [borrowDialogOpen, setBorrowDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<any>(null);

  const { data: books, isLoading } = useLibraryBooks((category && category !== 'all') ? category : undefined, searchQuery || undefined);
  const { data: myBorrowings } = useMyBorrowings(user?.id || '');
  const addBook = useAddLibraryBook();
  const borrowBook = useBorrowBook();

  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    isbn: '',
    category: '',
    department: '',
    total_copies: 1,
    available_copies: 1,
    shelf_location: '',
  });

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    await addBook.mutateAsync({
      ...newBook,
      cover_url: null,
    });
    setAddDialogOpen(false);
    setNewBook({
      title: '',
      author: '',
      isbn: '',
      category: '',
      department: '',
      total_copies: 1,
      available_copies: 1,
      shelf_location: '',
    });
  };

  const handleBorrowBook = async () => {
    if (!selectedBook || !user) return;
    const dueDate = format(addDays(new Date(), 14), 'yyyy-MM-dd');
    await borrowBook.mutateAsync({
      book_id: selectedBook.id,
      student_id: user.id,
      due_date: dueDate,
    });
    setBorrowDialogOpen(false);
    setSelectedBook(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Ensure data is always an array to prevent crash
  const safeBooks = Array.isArray(books) ? books : [];
  const safeBorrowings = Array.isArray(myBorrowings) ? myBorrowings : [];

  return (
    <div className="space-y-8 animate-fade-in max-w-full overflow-hidden">
      <div className="flex flex-col gap-2 md:flex-row md:justify-between md:items-center">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Library
          </h1>
          <p className="text-muted-foreground text-lg">
            Discover your next great read
          </p>
        </div>

        {userRole === 'admin' && (
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="shadow-lg hover:shadow-primary/25 transition-all w-full md:w-auto">
                <Plus className="mr-2 h-5 w-5" /> Add Book
              </Button>
            </DialogTrigger>
            <DialogContent>
              {/* ... existing dialog content ... */}
              <DialogHeader>
                <DialogTitle>Add New Book</DialogTitle>
                <DialogDescription>Add a book to the library catalog</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddBook} className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={newBook.title} onChange={(e) => setNewBook({ ...newBook, title: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Author</Label>
                  <Input value={newBook.author} onChange={(e) => setNewBook({ ...newBook, author: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>ISBN</Label>
                    <Input value={newBook.isbn} onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={newBook.category} onValueChange={(v) => setNewBook({ ...newBook, category: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Copies</Label>
                    <Input
                      type="number"
                      value={newBook.total_copies}
                      onChange={(e) => setNewBook({
                        ...newBook,
                        total_copies: parseInt(e.target.value),
                        available_copies: parseInt(e.target.value)
                      })}
                      min={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Shelf Location</Label>
                    <Input value={newBook.shelf_location} onChange={(e) => setNewBook({ ...newBook, shelf_location: e.target.value })} placeholder="e.g., A-12" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={addBook.isPending}>
                    {addBook.isPending ? 'Adding...' : 'Add Book'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="catalog" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto no-scrollbar p-1 bg-muted/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <TabsTrigger value="catalog" className="flex-1 min-w-[120px]">Book Catalog</TabsTrigger>
          {(userRole === 'student' || userRole === 'teacher') &&
            <TabsTrigger value="my-books" className="flex-1 min-w-[120px]">My Borrowings</TabsTrigger>
          }
        </TabsList>

        <TabsContent value="catalog" className="space-y-6 mt-6">
          {/* Search & Filter */}
          <div className="glass-card rounded-xl p-4 md:p-6 animate-slide-up">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title, author, or ISBN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 bg-background/50"
                />
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full md:w-[200px] h-11 bg-background/50">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Book Grid */}
          {safeBooks.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {safeBooks.map((book, index) => (
                <div
                  key={book.id}
                  className="group relative flex flex-col glass-card hover-lift rounded-xl overflow-hidden h-full"
                  style={{ animation: `slideUp 0.5s ease-out ${index * 0.05}s backwards` }}
                >
                  <div className="relative h-40 bg-gradient-to-br from-primary/5 to-primary/10 p-6 flex items-center justify-center overflow-hidden group-hover:from-primary/10 group-hover:to-primary/20 transition-colors">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent" />
                    <Book className="h-16 w-16 text-primary/40 group-hover:scale-110 transition-transform duration-500" />
                    <Badge
                      className="absolute top-3 right-3 shadow-sm"
                      variant={book.available_copies > 0 ? 'secondary' : 'destructive'}
                    >
                      {book.available_copies > 0 ? `${book.available_copies} Available` : 'Out of Stock'}
                    </Badge>
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <div className="mb-2">
                      {book.category && (
                        <span className="text-xs font-medium text-primary/80 bg-primary/5 px-2 py-0.5 rounded-full">
                          {book.category}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-lg leading-tight mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">{book.author}</p>

                    <div className="mt-auto space-y-3 pt-3 border-t border-border/50">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{book.shelf_location || 'General Shelf'}</span>
                        <span>{book.isbn || 'No ISBN'}</span>
                      </div>

                      {(userRole === 'student' || userRole === 'teacher') && book.available_copies > 0 && (
                        <Button
                          className="w-full shadow-sm hover:shadow-md transition-all active:scale-95"
                          onClick={() => {
                            setSelectedBook(book);
                            setBorrowDialogOpen(true);
                          }}
                        >
                          <BookOpen className="mr-2 h-4 w-4" /> Borrow Now
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
              <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Search className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No books found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                We couldn't find any books matching your search. Try adjusting your filters.
              </p>
            </div>
          )}
        </TabsContent>

        {(userRole === 'student' || userRole === 'teacher') && (
          <TabsContent value="my-books" className="space-y-6 mt-6">
            {safeBorrowings.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {safeBorrowings.map((borrowing, index) => {
                  const isOverdue = !borrowing.returned_at && isPast(new Date(borrowing.due_date));
                  return (
                    <div
                      key={borrowing.id}
                      className={cn(
                        "glass-card hover-lift rounded-xl p-5 border-l-4 animate-slide-up",
                        isOverdue ? "border-l-destructive" : "border-l-primary"
                      )}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold line-clamp-1">{borrowing.library_books?.title}</h3>
                          <p className="text-sm text-muted-foreground">{borrowing.library_books?.author}</p>
                        </div>
                        <Badge variant={borrowing.returned_at ? 'secondary' : isOverdue ? 'destructive' : 'outline'}>
                          {borrowing.returned_at ? 'Returned' : isOverdue ? 'Overdue' : 'Active'}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm bg-muted/30 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <span className="font-medium">Due: {format(new Date(borrowing.due_date), 'PPP')}</span>
                        </div>
                        {isOverdue && borrowing.fine_amount > 0 && (
                          <div className="flex items-center gap-2 text-destructive font-medium">
                            <AlertCircle className="h-4 w-4" />
                            <span>Fine: ₹{borrowing.fine_amount}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
                <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                  <BookOpen className="h-10 w-10 text-primary/40" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No borrowed books</h3>
                <p className="text-muted-foreground">
                  You haven't borrowed any books yet. Check the catalog to get started!
                </p>
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Borrow Dialog */}
      <Dialog open={borrowDialogOpen} onOpenChange={setBorrowDialogOpen}>
        <DialogContent className="glass-heavy">
          <DialogHeader>
            <DialogTitle>Confirm Borrowing</DialogTitle>
            <DialogDescription>
              You are about to borrow <span className="font-semibold text-foreground">"{selectedBook?.title}"</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-2">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Library Policy</span>
                <span className="font-medium">Standard Loan</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Return By</span>
                <span className="font-semibold text-primary">{format(addDays(new Date(), 14), 'PPP')}</span>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setBorrowDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleBorrowBook} disabled={borrowBook.isPending} className="px-8">
                {borrowBook.isPending ? 'Processing...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
