import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
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

const CATEGORIES = ['Fiction', 'Non-Fiction', 'Science', 'Technology', 'Engineering', 'Mathematics', 'Reference', 'Magazines'];

export default function Library() {
  const { user, userRole } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<string>('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [borrowDialogOpen, setBorrowDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<any>(null);

  const { data: books, isLoading } = useLibraryBooks(category || undefined, searchQuery || undefined);
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

  return (
    <DashboardLayout>
      <div className="space-y-6 stagger-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Library</h1>
            <p className="text-muted-foreground">Browse and borrow books</p>
          </div>

          {userRole === 'admin' && (
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add Book
                </Button>
              </DialogTrigger>
              <DialogContent>
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

        <Tabs defaultValue="catalog">
          <TabsList>
            <TabsTrigger value="catalog">Book Catalog</TabsTrigger>
            {userRole === 'student' && <TabsTrigger value="my-books">My Borrowings</TabsTrigger>}
          </TabsList>

          <TabsContent value="catalog" className="space-y-4">
            {/* Search & Filter */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by title, author, or ISBN..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Book Grid */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : books && books.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {books.map(book => (
                  <Card key={book.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="p-3 rounded-lg bg-primary/10">
                          <Book className="h-6 w-6 text-primary" />
                        </div>
                        <Badge variant={book.available_copies > 0 ? 'default' : 'destructive'}>
                          {book.available_copies > 0 ? `${book.available_copies} available` : 'Not available'}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg mt-3 line-clamp-2">{book.title}</CardTitle>
                      <CardDescription>{book.author}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {book.category && <Badge variant="outline">{book.category}</Badge>}
                      {book.shelf_location && (
                        <p className="text-muted-foreground">Shelf: {book.shelf_location}</p>
                      )}
                      {book.isbn && (
                        <p className="text-muted-foreground text-xs">ISBN: {book.isbn}</p>
                      )}
                      {userRole === 'student' && book.available_copies > 0 && (
                        <Button
                          className="w-full mt-3"
                          size="sm"
                          onClick={() => {
                            setSelectedBook(book);
                            setBorrowDialogOpen(true);
                          }}
                        >
                          <BookOpen className="mr-2 h-4 w-4" /> Borrow
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Book className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No books found</h3>
                  <p className="text-muted-foreground">Try adjusting your search</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {userRole === 'student' && (
            <TabsContent value="my-books" className="space-y-4">
              {myBorrowings && myBorrowings.length > 0 ? (
                <div className="space-y-4">
                  {myBorrowings.map(borrowing => {
                    const isOverdue = !borrowing.returned_at && isPast(new Date(borrowing.due_date));
                    return (
                      <Card key={borrowing.id} className={isOverdue ? 'border-destructive' : ''}>
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <CardTitle>{borrowing.library_books?.title}</CardTitle>
                              <CardDescription>{borrowing.library_books?.author}</CardDescription>
                            </div>
                            <Badge variant={borrowing.returned_at ? 'secondary' : isOverdue ? 'destructive' : 'default'}>
                              {borrowing.returned_at ? 'Returned' : isOverdue ? 'Overdue' : 'Borrowed'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>Due: {format(new Date(borrowing.due_date), 'PPP')}</span>
                          </div>
                          {isOverdue && borrowing.fine_amount > 0 && (
                            <div className="flex items-center gap-1 text-destructive">
                              <AlertCircle className="h-4 w-4" />
                              <span>Fine: Rs. {borrowing.fine_amount}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No borrowed books</h3>
                    <p className="text-muted-foreground">Visit the catalog to borrow books</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}
        </Tabs>

        {/* Borrow Dialog */}
        <Dialog open={borrowDialogOpen} onOpenChange={setBorrowDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Borrow Book</DialogTitle>
              <DialogDescription>
                You are about to borrow "{selectedBook?.title}" by {selectedBook?.author}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm"><strong>Due Date:</strong> {format(addDays(new Date(), 14), 'PPPP')}</p>
                <p className="text-sm text-muted-foreground mt-1">Books must be returned within 14 days</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setBorrowDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleBorrowBook} disabled={borrowBook.isPending}>
                  {borrowBook.isPending ? 'Processing...' : 'Confirm Borrow'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
