
interface PricingDetail {
  type: string;
  rates: string[];
}

const pricingDetails: PricingDetail[] = [
  {
    type: "Cycle",
    rates: [
      "0–2 hrs: ₹5",
      "2–6 hrs: ₹5",
      "6–12 hrs: ₹10",
      "12–24 hrs: ₹15",
      ">24 hrs: ₹20/day",
      "Monthly: ₹300",
      "Helmet (optional): ₹2/day"
    ]
  },
  {
    type: "Two-Wheeler",
    rates: [
      "0–6 hrs: ₹10",
      "6–12 hrs: ₹30",
      "12–24 hrs: ₹40",
      ">24 hrs: ₹40/day",
      "Monthly: ₹600",
      "Helmet (optional): ₹2/day"
    ]
  },
  {
    type: "Three-Wheeler",
    rates: [
      "0–6 hrs: ₹30",
      "6–12 hrs: ₹60",
      "12–24 hrs: ₹80",
      ">24 hrs: ₹80/day",
      "Monthly: ₹1200"
    ]
  },
  {
    type: "Four-Wheeler",
    rates: [
      "0–6 hrs: ₹40",
      "6–24 hrs: ₹80",
      ">24 hrs: ₹80/day",
      "Monthly: ₹1500"
    ]
  }
];

const ParkingRatesGrid = () => (
  <div className="mt-6">
    <span className="block font-semibold text-blue-700 mb-2">Parking Rates:</span>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
      {pricingDetails.map(detail => (
        <div key={detail.type} className="bg-gray-50 rounded-lg p-2 border border-blue-100">
          <div className="font-medium text-gray-900">{detail.type}</div>
          <ul className="pl-4 list-disc space-y-0.5">
            {detail.rates.map(rate => (
              <li key={rate} className="text-xs text-gray-700">{rate}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </div>
);

export default ParkingRatesGrid;
