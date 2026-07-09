import { useEffect, useState } from "react";
import { Check } from "lucide-react";

interface ToastProps {
  message: string;
  show: boolean;
  duration?: number;
  onDone: () => void;
}

export function Toast({ message, show, duration = 2000, onDone }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDone, 200); // wait for fade-out
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onDone]);

  if (!show && !visible) return null;

  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 text-sm bg-green-600 text-white rounded-lg shadow-lg transition-all duration-200 ${
        visible && show
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-2"
      }`}
    >
      <Check className="w-4 h-4" />
      {message}
    </div>
  );
}
