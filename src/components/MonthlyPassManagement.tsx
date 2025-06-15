import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CreditCard, User, Phone, Car, Calendar, Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MonthlyPass } from "@/types/parking";
import { format } from "date-fns";

interface MonthlyPassManagementProps {
  passes: MonthlyPass[];
  onAddPass: (pass: Omit<MonthlyPass, 'id'>) => void;
  onBack: () => void;
}

type ViewState = 'overview' | 'active' | 'expired' | 'all' | 'create';

const MonthlyPassManagement = ({ passes, onAddPass, onBack }: MonthlyPassManagementProps) => {
  const [currentView, setCurrentView] = useState<ViewState>('overview');
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    passType: 'basic' as 'basic' | 'standard' | 'premium',
    vehicleType: 'two-wheeler' as 'two-wheeler' | 'three-wheeler' | 'four-wheeler',
    ownerName: '',
    ownerPhone: '',
    duration: '1' // months
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const passTypes = [
    { value: 'cycle', label: 'Cycle Pass', aliases: ['Cycle'], price: 300, description: 'For bicycles/Cycles only', vehicleType: 'cycle' },
    { value: 'two-wheeler', label: 'Two-Wheeler Pass', aliases: ['Motercycle', 'Bike'], price: 600, description: 'For Motorcycles, Scooters', vehicleType: 'two-wheeler' },
    { value: 'three-wheeler', label: 'Three-Wheeler Pass', aliases: ['Auto Rickshaw'], price: 1200, description: 'For Auto Rickshaws only', vehicleType: 'three-wheeler' },
    { value: 'four-wheeler', label: 'Four-Wheeler Pass', aliases: ['Car'], price: 1500, description: 'For Cars/SUVs', vehicleType: 'four-wheeler' }
  ];

  const activePasses = passes.filter(pass => pass.status === 'active' && pass.endDate > new Date());
  const expiredPasses = passes.filter(pass => pass.status === 'expired' || pass.endDate <= new Date());

  const getFilteredPasses = () => {
    let filteredPasses = passes;
    
    switch (currentView) {
      case 'active':
        filteredPasses = activePasses;
        break;
      case 'expired':
        filteredPasses = expiredPasses;
        break;
      case 'all':
        filteredPasses = passes;
        break;
      default:
        filteredPasses = passes;
    }

    if (searchTerm) {
      filteredPasses = filteredPasses.filter(pass => 
        pass.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pass.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filteredPasses;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vehicleNumber.trim() || !formData.ownerName.trim() || !formData.ownerPhone.trim()) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    // Check if vehicle already has an active pass
    const existingPass = passes.find(
      pass => pass.vehicleNumber.toUpperCase() === formData.vehicleNumber.toUpperCase() && 
      pass.status === 'active'
    );

    if (existingPass) {
      toast({
        title: "Error",
        description: "This vehicle already has an active pass",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedPassType = passTypes.find(type => type.value === formData.passType);
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + parseInt(formData.duration));

      const newPass: Omit<MonthlyPass, 'id'> = {
        vehicleNumber: formData.vehicleNumber.toUpperCase(),
        passType: formData.passType,
        vehicleType: selectedPassType?.vehicleType as 'cycle' | 'two-wheeler' | 'three-wheeler' | 'four-wheeler',
        ownerName: formData.ownerName,
        ownerPhone: formData.ownerPhone,
        startDate,
        endDate,
        amount: selectedPassType!.price * parseInt(formData.duration),
        status: 'active'
      };

      onAddPass(newPass);
      
      toast({
        title: "Success!",
        description: `Monthly pass created for ${formData.vehicleNumber.toUpperCase()}`,
      });

      setFormData({
        vehicleNumber: '',
        passType: 'basic',
        vehicleType: 'two-wheeler',
        ownerName: '',
        ownerPhone: '',
        duration: '1'
      });
      setCurrentView('overview');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create monthly pass. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPassCard = (pass: MonthlyPass) => (
    <Card key={pass.id} className={`border-l-4 ${pass.status === 'active' && pass.endDate > new Date() ? 'border-l-green-500' : 'border-l-red-500'}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              <span className="font-semibold">{pass.vehicleNumber}</span>
              <Badge variant="default" className={pass.status === 'active' && pass.endDate > new Date() ? "bg-green-600" : "bg-red-600"}>
                {pass.passType.toUpperCase()}
              </Badge>
              {pass.endDate <= new Date() && (
                <Badge variant="destructive" className="text-xs">
                  EXPIRED
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>{pass.ownerName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-4 w-4" />
              <span>{pass.ownerPhone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>Valid until: {pass.endDate instanceof Date ? format(pass.endDate, "dd/MM/yyyy") : pass.endDate.toLocaleDateString()}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">₹{pass.amount}</p>
            <p className="text-sm text-gray-500">{pass.vehicleType}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderCreateForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="vehicleNumber" className="text-base font-semibold">
            Vehicle Number *
          </Label>
          <Input
            id="vehicleNumber"
            value={formData.vehicleNumber}
            onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value})}
            placeholder="Enter vehicle number"
            className="text-lg py-3"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ownerName" className="text-base font-semibold">
            Owner Name *
          </Label>
          <Input
            id="ownerName"
            value={formData.ownerName}
            onChange={(e) => setFormData({...formData, ownerName: e.target.value})}
            placeholder="Enter owner name"
            className="text-lg py-3"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ownerPhone" className="text-base font-semibold">
            Phone Number *
          </Label>
          <Input
            id="ownerPhone"
            value={formData.ownerPhone}
            onChange={(e) => setFormData({...formData, ownerPhone: e.target.value})}
            placeholder="Enter phone number"
            className="text-lg py-3"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-base font-semibold">Duration *</Label>
          <RadioGroup
            value={formData.duration}
            onValueChange={(value) => setFormData({...formData, duration: value})}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="1" id="1month" />
              <Label htmlFor="1month">1 Month</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="3" id="3months" />
              <Label htmlFor="3months">3 Months</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="6" id="6months" />
              <Label htmlFor="6months">6 Months</Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-base font-semibold">Pass Type *</Label>
        <RadioGroup
          value={formData.passType}
          onValueChange={(value) => {
            const selectedType = passTypes.find(type => type.value === value);
            setFormData({
              ...formData, 
              passType: value as 'cycle' | 'two-wheeler' | 'three-wheeler' | 'four-wheeler',
              vehicleType: selectedType?.vehicleType as 'cycle' | 'two-wheeler' | 'three-wheeler' | 'four-wheeler'
            });
          }}
          className="space-y-3"
        >
          {passTypes.map((type) => (
            <div key={type.value} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value={type.value} id={type.value} />
              <div className="flex-1">
                <Label htmlFor={type.value} className="font-medium cursor-pointer">
                  {type.label}
                  {type.aliases && type.aliases.length > 0 && (
                    <span className="text-xs text-gray-400 ml-2">
                      / {type.aliases.join(' / ')}
                    </span>
                  )}
                  {' '} - ₹{type.price * parseInt(formData.duration)}/
                  {formData.duration === '1' ? 'month' : `${formData.duration} months`}
                </Label>
                <p className="text-sm text-gray-500">{type.description}</p>
              </div>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentView('overview')}
          className="flex-1"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create Pass"}
        </Button>
      </div>
    </form>
  );

  const renderPassList = () => {
    const filteredPasses = getFilteredPasses();
    const viewTitle = {
      active: 'Active Passes',
      expired: 'Expired Passes',
      all: 'All Passes'
    }[currentView] || 'Passes';

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{viewTitle} ({filteredPasses.length})</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by vehicle or owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>

        {filteredPasses.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No {viewTitle} Found</h3>
            <p className="text-gray-500">
              {searchTerm ? 'No passes match your search criteria.' : `No ${viewTitle.toLowerCase()} available.`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPasses.map(renderPassCard)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={currentView === 'overview' ? onBack : () => setCurrentView('overview')}
          className="mb-6 hover:bg-white/50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {currentView === 'overview' ? 'Back to Dashboard' : 'Back to Overview'}
        </Button>

        <Card className="bg-white shadow-xl mb-6">
          <CardHeader className="text-center bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
            <div className="flex justify-center mb-4">
              <CreditCard className="h-16 w-16" />
            </div>
            <CardTitle className="text-2xl">Monthly Pass Management</CardTitle>
            <CardDescription className="text-purple-100">
              Manage monthly parking passes for regular users
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-8">
            {currentView === 'overview' && (
              <div className="space-y-8">
                {/* Create New Pass Button - Top */}
                <Button 
                  onClick={() => setCurrentView('create')}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-3 text-lg font-semibold"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create New Monthly Pass
                </Button>

                {/* Interactive Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card 
                    className="bg-green-50 border-green-200 cursor-pointer hover:bg-green-100 transition-colors"
                    onClick={() => setCurrentView('active')}
                  >
                    <CardContent className="p-4 text-center">
                      <h3 className="font-semibold text-green-700">Active Passes</h3>
                      <p className="text-2xl font-bold text-green-600">{activePasses.length}</p>
                      <p className="text-xs text-green-600 mt-1">Click to view all</p>
                    </CardContent>
                  </Card>
                  
                  <Card 
                    className="bg-red-50 border-red-200 cursor-pointer hover:bg-red-100 transition-colors"
                    onClick={() => setCurrentView('expired')}
                  >
                    <CardContent className="p-4 text-center">
                      <h3 className="font-semibold text-red-700">Expired Passes</h3>
                      <p className="text-2xl font-bold text-red-600">{expiredPasses.length}</p>
                      <p className="text-xs text-red-600 mt-1">Click to view all</p>
                    </CardContent>
                  </Card>
                  
                  <Card 
                    className="bg-blue-50 border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
                    onClick={() => setCurrentView('all')}
                  >
                    <CardContent className="p-4 text-center">
                      <h3 className="font-semibold text-blue-700">Total Passes</h3>
                      <p className="text-2xl font-bold text-blue-600">{passes.length}</p>
                      <p className="text-xs text-blue-600 mt-1">Click to view all</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Active Passes Preview */}
                {activePasses.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Recent Active Passes</h3>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCurrentView('active')}
                      >
                        View All Active
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {activePasses.slice(0, 3).map(renderPassCard)}
                    </div>
                    {activePasses.length > 3 && (
                      <p className="text-center text-gray-500 mt-4">
                        And {activePasses.length - 3} more active passes...
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {currentView === 'create' && renderCreateForm()}
            {(currentView === 'active' || currentView === 'expired' || currentView === 'all') && renderPassList()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MonthlyPassManagement;

// ------------- WARNING: This file is getting long. Please consider refactoring it for easier maintenance!
