
import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Camera, ScanLine, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VehicleScannerProps {
  onScanResult: (vehicleNumber: string) => void;
  onBack: () => void;
  title: string;
  description: string;
}

const VehicleScanner = ({ onScanResult, onBack, title, description }: VehicleScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [manualEntry, setManualEntry] = useState("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  }, [stream]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      setStream(mediaStream);
      setIsCameraActive(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions or use manual entry.",
        variant: "destructive",
      });
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64 image
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    // Stop camera and process the captured image
    stopCamera();
    processImage(imageData);
  };

  const processImage = async (imageData: string) => {
    setIsScanning(true);
    
    // Simulate OCR processing - in a real app, you'd use a service like Tesseract.js or cloud OCR
    setTimeout(() => {
      // Mock license plate detection - extract alphanumeric patterns
      const mockPlateNumbers = [
        "ABC-1234", "XYZ-5678", "DEF-9012", "GHI-3456", "JKL-7890",
        "MNO-2345", "PQR-6789", "STU-1357", "VWX-2468", "YZA-8024"
      ];
      
      const detectedPlate = mockPlateNumbers[Math.floor(Math.random() * mockPlateNumbers.length)];
      
      setIsScanning(false);
      toast({
        title: "License Plate Detected!",
        description: `Found vehicle number: ${detectedPlate}`,
      });
      
      onScanResult(detectedPlate);
    }, 2000);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualEntry.trim()) {
      onScanResult(manualEntry.trim());
    } else {
      toast({
        title: "Error",
        description: "Please enter a vehicle number",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="mb-6 hover:bg-white/50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card className="bg-white shadow-xl">
          <CardHeader className="text-center bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
            <div className="flex justify-center mb-4">
              <ScanLine className="h-16 w-16" />
            </div>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription className="text-blue-100">
              {description}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-8">
            {isScanning ? (
              <div className="text-center space-y-4">
                <div className="animate-pulse">
                  <ScanLine className="h-16 w-16 mx-auto text-blue-600 mb-4" />
                </div>
                <h3 className="text-xl font-semibold">Processing Image...</h3>
                <p className="text-gray-600">Detecting license plate number</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                </div>
              </div>
            ) : isCameraActive ? (
              <div className="space-y-4">
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-64 object-cover rounded-lg border-2 border-blue-300"
                  />
                  <div className="absolute inset-0 border-2 border-dashed border-white/50 rounded-lg m-4 flex items-center justify-center">
                    <div className="text-white text-center bg-black/50 p-2 rounded">
                      <p className="text-sm">Position license plate within frame</p>
                    </div>
                  </div>
                  <Button
                    onClick={stopCamera}
                    variant="secondary"
                    size="icon"
                    className="absolute top-2 right-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex gap-4">
                  <Button
                    onClick={capturePhoto}
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 text-lg font-semibold"
                  >
                    <Camera className="h-6 w-6 mr-2" />
                    Capture & Scan
                  </Button>
                </div>
                
                <canvas ref={canvasRef} className="hidden" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <Button
                    onClick={startCamera}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-6 text-lg font-semibold"
                  >
                    <Camera className="h-6 w-6 mr-2" />
                    Open Camera Scanner
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    Open camera to scan license plate
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or enter manually</span>
                  </div>
                </div>

                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="manualEntry" className="text-base font-semibold">
                      Vehicle Number
                    </Label>
                    <Input
                      id="manualEntry"
                      type="text"
                      value={manualEntry}
                      onChange={(e) => setManualEntry(e.target.value)}
                      placeholder="Enter vehicle number manually"
                      className="text-lg py-3 px-4"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="outline"
                    className="w-full py-3 text-lg font-semibold"
                  >
                    Submit Manual Entry
                  </Button>
                </form>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VehicleScanner;
