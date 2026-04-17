'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { forgotPassword, resetPassword } from '@/lib/api/client';

type Step = 'email' | 'otp' | 'done';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      await forgotPassword(email.trim());
      setStep('otp');
      startCountdown();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      prev?.focus();
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const otpCode = otp.join('');
    if (otpCode.length !== 6) { setError('Vui lòng nhập đủ 6 số OTP'); return; }
    if (newPassword.length < 6) { setError('Mật khẩu mới phải có ít nhất 6 ký tự'); return; }
    if (newPassword !== confirmPassword) { setError('Mật khẩu xác nhận không khớp'); return; }

    setLoading(true);
    try {
      await resetPassword(email, otpCode, newPassword);
      setStep('done');
    } catch (err: any) {
      setError(err.message || 'Mã OTP không đúng hoặc đã hết hạn');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setLoading(true);
    setError('');
    try {
      await forgotPassword(email);
      startCountdown();
    } catch {} finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Step: Enter Email */}
        {step === 'email' && (
          <div className="rounded-2xl bg-white p-8 shadow-xl border border-gray-100">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl mb-4 shadow-lg shadow-primary/20">
                🔐
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900">Quên mật khẩu?</h1>
              <p className="mt-2 text-sm text-gray-500">Nhập email để nhận mã OTP đặt lại mật khẩu</p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email đăng ký</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-primary to-accent py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? '⏳ Đang gửi...' : 'Gửi mã OTP'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              <Link href="/login" className="font-semibold text-primary hover:text-primary-600 transition-colors">
                ← Quay lại đăng nhập
              </Link>
            </p>
          </div>
        )}

        {/* Step: Enter OTP + New Password */}
        {step === 'otp' && (
          <div className="rounded-2xl bg-white p-8 shadow-xl border border-gray-100">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-3xl mb-4 shadow-lg shadow-green-500/20">
                📩
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900">Nhập mã OTP</h1>
              <p className="mt-2 text-sm text-gray-500">
                Mã 6 số đã được gửi đến <span className="font-bold text-gray-700">{email}</span>
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-6">
              {/* OTP Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">Mã OTP</label>
                <div className="flex justify-center gap-2">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className={`w-12 h-14 rounded-xl border-2 text-center text-xl font-black transition-all focus:outline-none ${
                        digit
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-gray-200 bg-gray-50 text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20'
                      }`}
                    />
                  ))}
                </div>
                <div className="mt-3 text-center">
                  {countdown > 0 ? (
                    <p className="text-xs text-gray-400">Gửi lại sau {countdown}s</p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      className="text-xs font-bold text-primary hover:text-primary-600 transition-colors"
                    >
                      Gửi lại mã OTP
                    </button>
                  )}
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mật khẩu mới</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Xác nhận mật khẩu</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-primary to-accent py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? '⏳ Đang xử lý...' : '🔓 Đặt lại mật khẩu'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              <button onClick={() => { setStep('email'); setError(''); }} className="font-semibold text-gray-600 hover:text-gray-800 transition-colors">
                ← Quay lại nhập email
              </button>
            </p>
          </div>
        )}

        {/* Step: Success */}
        {step === 'done' && (
          <div className="rounded-2xl bg-white p-8 shadow-xl border border-gray-100 text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-4xl mb-6">
              🎉
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900">Thành công!</h1>
            <p className="mt-3 text-sm text-gray-500">Mật khẩu đã được đặt lại. Bạn có thể đăng nhập với mật khẩu mới.</p>
            <button
              onClick={() => router.push('/login')}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-primary to-accent py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:brightness-110"
            >
              Đi đến trang đăng nhập
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
