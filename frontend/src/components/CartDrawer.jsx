import React, { useRef, useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { API_BASE } from '../config';

export default function CartDrawer({ 
  isOpen, 
  onClose, 
  cart, 
  currentLocation,
  onUpdateQuantity, 
  onRemoveItem,
  onBookingSuccess 
}) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [scheduledDate, setScheduledDate] = useState('Today, 20 Nov');
  const [scheduledTime, setScheduledTime] = useState('02:00 PM - 03:00 PM');
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const fieldRefs = useRef({});

  if (!isOpen) return null;

  const handleCheckout = async () => {
    if (isSubmitting) return;
    setSubmitted(true);
    const errors = {};
    if (!/^[\p{L} ]+$/u.test(customerName.trim()) || customerName.trim().replace(/\s+/g, '').length < 2) {
      errors.customer_name = 'Enter a valid full name (at least 2 letters).';
    }
    if (!/^[6-9]\d{9}$/.test(customerPhone)) {
      errors.customer_phone = 'Enter a valid 10-digit Indian mobile number.';
    }
    setFieldErrors(errors);
    setTouched({ customer_name: true, customer_phone: true });
    if (Object.keys(errors).length) {
      const firstInvalid = Object.keys(errors)[0];
      fieldRefs.current[firstInvalid]?.focus();
      fieldRefs.current[firstInvalid]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName,
          customer_phone: customerPhone,
          address: currentLocation?.address_line || '3, Norris Rd, Richmond Town, Bengaluru',
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
          payment_method: paymentMethod
        })
      });

      const data = await response.json();
      if (response.ok) {
        onBookingSuccess(data);
        onClose();
      } else {
        const backendErrors = data.errors && typeof data.errors === 'object' ? data.errors : {};
        const mapped = {};
        if (backendErrors.customer_name) mapped.customer_name = backendErrors.customer_name;
        if (backendErrors.customer_phone) mapped.customer_phone = backendErrors.customer_phone;
        setFieldErrors(current => ({ ...current, ...mapped }));
        if (Object.keys(mapped).length) {
          setTouched(current => ({ ...current, ...Object.fromEntries(Object.keys(mapped).map(field => [field, true])) }));
          fieldRefs.current[Object.keys(mapped)[0]]?.focus();
        } else {
          setErrorMessage(data.error || data.message || 'Failed to place booking');
        }
      }
    } catch (err) {
      setErrorMessage('Network error connecting to Urbab366 backend');
    } finally {
      setIsSubmitting(false);
    }
  };

  const visitingFee = 49;
  const grandTotal = (cart?.total_amount || 0) + visitingFee;
  const updateContact = (field, value) => {
    if (field === 'customer_name') setCustomerName(value);
    else setCustomerPhone(value);
    setErrorMessage('');
    if (submitted || touched[field]) {
      const error = field === 'customer_name'
        ? (/^[\p{L} ]+$/u.test(value.trim()) && value.trim().replace(/\s+/g, '').length >= 2 ? '' : 'Enter a valid full name (at least 2 letters).')
        : (/^[6-9]\d{9}$/.test(value) ? '' : 'Enter a valid 10-digit Indian mobile number.');
      setFieldErrors(current => {
        const next = { ...current };
        if (error) next[field] = error;
        else delete next[field];
        return next;
      });
    }
  };
  const blurContact = field => {
    setTouched(current => ({ ...current, [field]: true }));
    const value = field === 'customer_name' ? customerName : customerPhone;
    const error = field === 'customer_name'
      ? (/^[\p{L} ]+$/u.test(value.trim()) && value.trim().replace(/\s+/g, '').length >= 2 ? '' : 'Enter a valid full name (at least 2 letters).')
      : (/^[6-9]\d{9}$/.test(value) ? '' : 'Enter a valid 10-digit Indian mobile number.');
    setFieldErrors(current => {
      const next = { ...current };
      if (error) next[field] = error;
      else delete next[field];
      return next;
    });
  };
  const contactClass = field => `mt-1 w-full p-2 text-xs bg-gray-50 border rounded-lg ${fieldErrors[field] ? 'border-red-500' : 'border-gray-200'}`;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-violet-950 via-neutral-900 to-indigo-950 text-white">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold">Your Booking Summary</h3>
              <span className="text-xs bg-emerald-500 text-neutral-950 px-2 py-0.5 rounded-full font-bold">
                {cart?.item_count || 0} {cart?.item_count === 1 ? 'item' : 'items'}
              </span>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-neutral-800 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Location Bar */}
          <div className="bg-violet-50 px-4 py-2.5 border-b border-violet-100 flex items-center gap-2 text-xs text-violet-950 font-medium">
            <MapPin className="w-4 h-4 text-violet-700 shrink-0" />
            <span className="truncate">
              Delivering to: <strong>{currentLocation?.area_name || 'Richmond Town, Bengaluru'}</strong>
            </span>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart?.items?.length > 0 ? (
              <>
                <div className="space-y-3">
                  {cart.items.map((item) => (
                    <div 
                      key={item.id}
                      className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <img 
                          src={item.image_url} 
                          alt={item.title}
                          className="w-12 h-12 rounded-lg object-cover shrink-0" 
                        />
                        <div className="overflow-hidden">
                          <p className="text-xs sm:text-sm font-semibold text-neutral-900 truncate">
                            {item.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            ₹{item.price} each · {item.duration_mins}m
                          </p>
                        </div>
                      </div>

                      {/* Stepper & Total */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center border border-violet-600 bg-white rounded-lg px-1.5 py-0.5 text-violet-700 shadow-xs">
                          <button 
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="w-5 h-5 flex items-center justify-center hover:bg-violet-50 rounded"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center font-bold text-xs">
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="w-5 h-5 flex items-center justify-center hover:bg-violet-50 rounded"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="text-xs sm:text-sm font-bold text-neutral-900 w-14 text-right">
                          ₹{item.price * item.quantity}
                        </span>

                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="text-gray-400 hover:text-rose-500 p-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Scheduling Details */}
                <div className="pt-3 border-t border-gray-100 space-y-3">
                  <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                    Select Appointment Slot
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-gray-500 mb-1">Date</label>
                      <select 
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg font-medium text-neutral-800"
                      >
                        <option>Today, 20 Nov</option>
                        <option>Tomorrow, 21 Nov</option>
                        <option>Saturday, 22 Nov</option>
                        <option>Sunday, 23 Nov</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-500 mb-1">Time Slot</label>
                      <select 
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg font-medium text-neutral-800"
                      >
                        <option>10:00 AM - 11:00 AM</option>
                        <option>12:00 PM - 01:00 PM</option>
                        <option>02:00 PM - 03:00 PM</option>
                        <option>04:00 PM - 05:00 PM</option>
                        <option>06:00 PM - 07:00 PM</option>
                      </select>
                    </div>
                  </div>

                  {/* Customer Contact */}
                  <div className="space-y-2 pt-2">
                    <label className="block text-xs font-semibold text-gray-600">Contact Details</label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block min-w-0 text-xs font-semibold text-gray-600">Full Name <span className="text-red-500">*</span>
                      <input 
                        type="text" 
                        placeholder="Your Full Name"
                        value={customerName}
                        ref={element => { fieldRefs.current.customer_name = element; }}
                        onChange={(e) => updateContact('customer_name', e.target.value)}
                        onBlur={() => blurContact('customer_name')}
                        aria-invalid={Boolean(fieldErrors.customer_name)}
                        className={contactClass('customer_name')}
                        required
                      />
                      {fieldErrors.customer_name && <p className="text-red-500 text-xs mt-1">{fieldErrors.customer_name}</p>}
                      </label>
                      <label className="block min-w-0 text-xs font-semibold text-gray-600">Phone Number <span className="text-red-500">*</span>
                      <input 
                        type="tel" 
                        placeholder="Phone Number"
                        value={customerPhone}
                        ref={element => { fieldRefs.current.customer_phone = element; }}
                        inputMode="numeric"
                        maxLength={10}
                        onChange={(e) => updateContact('customer_phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                        onBlur={() => blurContact('customer_phone')}
                        aria-invalid={Boolean(fieldErrors.customer_phone)}
                        className={contactClass('customer_phone')}
                        required
                      />
                      {fieldErrors.customer_phone && <p className="text-red-500 text-xs mt-1">{fieldErrors.customer_phone}</p>}
                      </label>
                    </div>
                  </div>

                  {/* Payment Choice */}
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Method</label>
                    <div className="flex gap-2 text-xs">
                      {['Cash on Delivery', 'UPI on Visit', 'Card'].map((pm) => (
                        <button
                          key={pm}
                          type="button"
                          onClick={() => setPaymentMethod(pm)}
                          className={`flex-1 py-1.5 px-2 rounded-lg border font-medium transition-colors ${
                            paymentMethod === pm 
                              ? 'border-violet-600 bg-violet-50 text-violet-700' 
                              : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {pm}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bill Breakdown */}
                <div className="pt-3 border-t border-gray-100 bg-gray-50/70 p-3 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Items Total</span>
                    <span>₹{cart?.total_amount || 0}</span>
                  </div>
                  {cart?.discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Promotional Discount</span>
                      <span>-₹{cart.discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Convenience & Visiting Fee</span>
                    <span>₹{visitingFee}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-200 flex justify-between text-sm font-bold text-neutral-900">
                    <span>Amount to Pay</span>
                    <span>₹{grandTotal}</span>
                  </div>
                </div>

                {/* Guarantee Pill */}
                <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Urbab366 Guarantee: 366-day service assurance on verified jobs.</span>
                </div>
              </>
            ) : (
              <div className="py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-violet-50 text-violet-600 mx-auto flex items-center justify-center mb-3">
                  <Calendar className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-neutral-800">Your cart is empty</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                  Browse our top rated salon, spa, cleaning, or appliance repair services in Bangalore and add them.
                </p>
              </div>
            )}

            {errorMessage && (
              <p className="text-xs text-rose-500 font-semibold p-2 bg-rose-50 rounded-lg">
                {errorMessage}
              </p>
            )}
          </div>

          {/* Checkout Footer Button */}
          {cart?.item_count > 0 && (
            <div className="p-4 border-t border-gray-100 bg-white shadow-lg">
              <button
                onClick={handleCheckout}
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-violet-700 hover:bg-violet-800 disabled:bg-violet-400 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-between group"
              >
                <div className="text-left">
                  <span className="block text-[11px] font-normal text-violet-200 uppercase tracking-wider">
                    Total Payable
                  </span>
                  <span className="text-base font-extrabold">₹{grandTotal}</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold">
                  <span>{isSubmitting ? 'Confirming...' : 'Confirm Booking'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
