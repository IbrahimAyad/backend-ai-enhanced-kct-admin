import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Calendar, TrendingUp, DollarSign, Users, Package } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Report {
  id: string;
  name: string;
  type: string;
  status: 'ready' | 'generating' | 'scheduled';
  last_generated: string;
  file_size?: string;
}

export const ReportsManagement = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      // Placeholder data for now
      const mockReports: Report[] = [
        {
          id: "1",
          name: "Monthly Sales Report",
          type: "sales",
          status: "ready",
          last_generated: "2024-01-15T10:30:00Z",
          file_size: "2.4 MB"
        },
        {
          id: "2",
          name: "Customer Analytics",
          type: "customers",
          status: "ready",
          last_generated: "2024-01-14T15:45:00Z",
          file_size: "1.8 MB"
        },
        {
          id: "3",
          name: "Inventory Summary",
          type: "inventory",
          status: "generating",
          last_generated: "2024-01-13T09:15:00Z"
        }
      ];
      
      setReports(mockReports);
      
      toast({
        title: "Reports Ready",
        description: "Reports data loaded successfully"
      });
    } catch (error) {
      console.error('Error loading reports:', error);
      toast({
        title: "Error",
        description: "Failed to load reports",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = (reportId: string) => {
    toast({
      title: "Generating Report",
      description: "Report generation started. You'll be notified when it's ready."
    });
  };

  const downloadReport = (reportId: string, reportName: string) => {
    toast({
      title: "Download Started",
      description: `Downloading ${reportName}...`
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-muted rounded w-64 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Reports</h1>
        </div>
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          Create Custom Report
        </Button>
      </div>

      <Tabs defaultValue="available" className="space-y-4">
        <TabsList>
          <TabsTrigger value="available">Available Reports</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
          <TabsTrigger value="templates">Report Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{report.name}</CardTitle>
                    <Badge 
                      variant={
                        report.status === 'ready' ? 'default' : 
                        report.status === 'generating' ? 'secondary' : 'outline'
                      }
                    >
                      {report.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      Last generated: {new Date(report.last_generated).toLocaleDateString()}
                    </div>
                    {report.file_size && (
                      <div className="text-sm text-muted-foreground">
                        Size: {report.file_size}
                      </div>
                    )}
                    <div className="flex space-x-2">
                      {report.status === 'ready' ? (
                        <Button 
                          size="sm" 
                          onClick={() => downloadReport(report.id, report.name)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => generateReport(report.id)}
                          disabled={report.status === 'generating'}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          {report.status === 'generating' ? 'Generating...' : 'Generate'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Scheduled Reports</h3>
              <p className="text-muted-foreground mb-4">
                Set up automated report generation to receive regular insights.
              </p>
              <Button>Schedule Report</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: DollarSign, name: "Sales Performance", description: "Revenue, orders, conversion rates" },
              { icon: Users, name: "Customer Insights", description: "User behavior, demographics, retention" },
              { icon: Package, name: "Product Analytics", description: "Best sellers, inventory, margins" },
              { icon: TrendingUp, name: "Growth Metrics", description: "KPIs, trends, forecasting" }
            ].map((template, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <template.icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">{template.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                  <Button variant="outline" size="sm">Use Template</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};