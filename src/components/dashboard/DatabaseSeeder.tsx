import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Loader2, CheckCircle, AlertCircle, BookOpen, Calendar, FileText, Brain, Bell } from 'lucide-react';
import { useSeedDatabase } from '@/hooks/useDatabaseSeed';
import { toast } from 'sonner';

export default function DatabaseSeeder() {
  const [results, setResults] = useState<{
    courses: number;
    classes: number;
    timetable: number;
    knowledge: number;
    materials: number;
    library: number;
    notifications: number;
  } | null>(null);

  const { mutate: seedDatabase, isPending, isError, error } = useSeedDatabase();

  const handleSeed = () => {
    seedDatabase(undefined, {
      onSuccess: (data) => {
        setResults(data);
        const total = data.courses + data.classes + data.timetable + data.knowledge + data.materials + data.library;
        if (total > 0) {
          toast.success(`Database seeded successfully! Added ${total} records.`);
        } else {
          toast.info('Database already contains sample data.');
        }
      },
      onError: (err) => {
        toast.error(`Seeding failed: ${err.message}`);
      },
    });
  };

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-muted/30">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Database className="h-5 w-5 text-primary" />
          </div>
          Database Seeder
        </CardTitle>
        <CardDescription>
          Populate the database with sample courses, timetable, and materials for testing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* What will be seeded */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4 text-primary" />
            <span>8 Courses</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 text-info" />
            <span>Timetable entries</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4 text-primary" />
            <span>10 Library Books</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4 text-success" />
            <span>Sample materials</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Brain className="h-4 w-4 text-warning" />
            <span>Knowledge base</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bell className="h-4 w-4 text-info" />
            <span>5 Notifications</span>
          </div>
        </div>

        {/* Results */}
        {results && (
          <div className="p-4 rounded-xl bg-success/5 border border-success/20 space-y-2">
            <div className="flex items-center gap-2 text-success font-medium">
              <CheckCircle className="h-4 w-4" />
              Seeding Complete
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {results.courses > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{results.courses}</Badge>
                  <span>courses added</span>
                </div>
              )}
              {results.classes > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{results.classes}</Badge>
                  <span>classes added</span>
                </div>
              )}
              {results.timetable > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{results.timetable}</Badge>
                  <span>timetable entries</span>
                </div>
              )}
              {results.knowledge > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{results.knowledge}</Badge>
                  <span>KB articles</span>
                </div>
              )}
              {results.materials > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{results.materials}</Badge>
                  <span>materials</span>
                </div>
              )}
              {results.library > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{results.library}</Badge>
                  <span>library books</span>
                </div>
              )}
              {results.notifications > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{results.notifications}</Badge>
                  <span>notifications</span>
                </div>
              )}
            </div>
            {Object.values(results).every(v => v === 0) && (
              <p className="text-sm text-muted-foreground">
                All sample data already exists in the database.
              </p>
            )}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
            <div className="flex items-center gap-2 text-destructive font-medium">
              <AlertCircle className="h-4 w-4" />
              Seeding Failed
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {(error as Error)?.message || 'An unknown error occurred'}
            </p>
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={handleSeed}
          disabled={isPending}
          className="w-full"
          size="lg"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Seeding Database...
            </>
          ) : (
            <>
              <Database className="h-4 w-4 mr-2" />
              Seed Sample Data
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          This will only add new records and won't duplicate existing data.
        </p>
      </CardContent>
    </Card>
  );
}
