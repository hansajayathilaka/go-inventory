import { useState } from 'react'
import {
  BarChart3,
  Monitor,
  Settings,
  Users,
  Package,
  Activity,
  FileText,
  TrendingUp,
  Shield
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { RoleBasedPOSAccess, useUserRole } from './RoleBasedPOSAccess'
import { ManagerDashboard } from './ManagerDashboard'
import { POSReports } from './POSReports'
import { PersonalSalesHistory } from './PersonalSalesHistory'

interface POSManagerInterfaceProps {
  className?: string
}

export function POSManagerInterface({ className }: POSManagerInterfaceProps) {
  const { user, isAdmin, roleDisplayName } = useUserRole()
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <RoleBasedPOSAccess requiredRole="manager">
      <div className={`p-4 space-y-6 ${className}`}>
        {/* Manager Interface Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-600" />
              Manager Control Center
            </h1>
            <p className="text-gray-600">
              Comprehensive POS management and reporting dashboard
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium">{user?.username}</div>
              <Badge 
                variant="default" 
                className="bg-green-100 text-green-800 border-green-300"
              >
                {roleDisplayName}
              </Badge>
            </div>
          </div>
        </div>

        {/* Manager Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Sales History</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <ManagerDashboard />
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <POSReports />
          </TabsContent>

          {/* Sales History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Complete Sales History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PersonalSalesHistory
                  cashierId={user?.id ? Number(user.id) : undefined}
                  maxRecords={1000} // Managers can see more records
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Tab (Admin users only) */}
          {isAdmin && (
            <TabsContent value="admin" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* System Management */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      System Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3">
                      <Button variant="outline" className="justify-start">
                        <Users className="h-4 w-4 mr-2" />
                        User Management
                      </Button>
                      <Button variant="outline" className="justify-start">
                        <Package className="h-4 w-4 mr-2" />
                        Inventory Settings
                      </Button>
                      <Button variant="outline" className="justify-start">
                        <Activity className="h-4 w-4 mr-2" />
                        System Logs
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* System Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="h-5 w-5" />
                      System Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">POS System</span>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Online
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Database</span>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Connected
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Backup Status</span>
                        <Badge variant="secondary">
                          Last: Today
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Active Sessions</span>
                        <Badge variant="outline">
                          3 Users
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions for Admins */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                      <Users className="h-6 w-6" />
                      <span className="text-xs">Manage Users</span>
                    </Button>
                    <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                      <Package className="h-6 w-6" />
                      <span className="text-xs">Inventory</span>
                    </Button>
                    <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                      <BarChart3 className="h-6 w-6" />
                      <span className="text-xs">Analytics</span>
                    </Button>
                    <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                      <Settings className="h-6 w-6" />
                      <span className="text-xs">Settings</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Manager Tips and Information */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Manager Features
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700 space-y-2">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <BarChart3 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Advanced Reports:</strong> Access detailed daily, weekly, and monthly sales analytics with export functionality.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Monitor className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Real-time Dashboard:</strong> Monitor live sales metrics, staff performance, and system alerts.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Staff Management:</strong> Track staff performance, efficiency metrics, and activity monitoring.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Package className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Inventory Alerts:</strong> Receive notifications for low stock items and inventory issues.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Complete History:</strong> Access unlimited sales history and transaction details.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Activity className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>System Monitoring:</strong> Track system health, user sessions, and performance metrics.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleBasedPOSAccess>
  )
}