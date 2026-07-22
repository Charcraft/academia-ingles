"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/compress-image";
import { countries, professions, examOptions } from "@/lib/constants";
import {
  Loader2,
  Upload,
  X,
  Eye,
  EyeOff,
  Image as ImageIcon,
} from "lucide-react";

const signupSchema = z.object({
  first_name: z
    .string()
    .min(1, "First name is required")
    .max(100, "First name is too long"),
  last_name: z
    .string()
    .min(1, "Last name is required")
    .max(100, "Last name is too long"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password is too long"),
  country: z.string().min(1, "Please select your country"),
  phone: z.string().optional(),
  profession: z.string().min(1, "Please select your profession"),
  license_number: z.string().min(1, "License number is required"),
  experience_years: z
    .number()
    .int("Must be a whole number")
    .min(0, "Must be 0 or greater")
    .max(60, "Must be 60 or less"),
  exam_interest: z.string().min(1, "Please select an exam"),
  privacy_consent: z.literal(true, {
    message: "You must accept the privacy notice",
  }),
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoCompressing, setPhotoCompressing] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      experience_years: 0,
      exam_interest: "",
      country: "",
      profession: "",
      phone: "",
      privacy_consent: false as unknown as true,
    },
  });

  const selectedCountry = watch("country");

  // Derive phone code from selected country
  const selectedCountryPhoneCode =
    countries.find((c) => c.code === selectedCountry)?.phoneCode ?? "";

  // Dropzone handlers
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setPhotoCompressing(true);

    try {
      const compressed = await compressImage(file);
      const previewUrl = URL.createObjectURL(compressed);
      setPhotoPreview(previewUrl);

      // Create a new File from the compressed blob
      const compressedFile = new File([compressed], "photo.webp", {
        type: "image/webp",
      });
      setPhotoFile(compressedFile);
    } catch {
      toast.error("Failed to process image. Please try another file.");
      setPhotoFile(null);
      setPhotoPreview(null);
    } finally {
      setPhotoCompressing(false);
    }
  }, []);

  const removePhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB max input
    disabled: loading || photoCompressing,
  });

  const onSubmit = async (data: SignupFormData) => {
    setLoading(true);
    const supabase = createClient();

    // 1. Sign up with Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.first_name,
          last_name: data.last_name,
        },
      },
    });

    if (authError) {
      toast.error(authError.message);
      setLoading(false);
      return;
    }

    const userId = authData.user?.id;
    if (!userId) {
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    // 2. Upload photo to 'validations' bucket if provided
    let photoUrl: string | null = null;
    if (photoFile) {
      const filePath = `${userId}/validation.${Date.now()}.webp`;
      const { error: uploadError } = await supabase.storage
        .from("validations")
        .upload(filePath, photoFile, {
          contentType: "image/webp",
          upsert: true,
        });

      if (!uploadError) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("validations").getPublicUrl(filePath);
        photoUrl = publicUrl;
      } else {
        toast.error("Photo upload failed, but your account was created.");
      }
    }

    // 3. Update profile with all form data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: profileError } = await (supabase as any).from("profiles").upsert(
      {
        id: userId,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        country: data.country,
        country_code: selectedCountryPhoneCode,
        phone: data.phone || "",
        profession: data.profession,
        license_number: data.license_number,
        experience_years: data.experience_years,
        exam_interest: data.exam_interest,
        validation_photo_url: photoUrl,
        role: "student",
      },
      { onConflict: "id" }
    );

    if (profileError) {
      toast.error("Profile update failed. Please contact support.");
      setLoading(false);
      return;
    }

    toast.success("Account created! Let's assess your English level.");
    router.push("/placement");
  };

  return (
    <div className="glass-card animate-fade-in p-8">
      <h1 className="mb-1 text-2xl font-bold text-slate-100">
        Create your account
      </h1>
      <p className="mb-8 text-sm text-slate-400">
        Start your journey toward medical English fluency.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* First Name & Last Name */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="first_name"
              className="mb-1.5 block text-sm font-medium text-slate-300"
            >
              First Name
            </label>
            <input
              id="first_name"
              type="text"
              placeholder="John"
              className="input-field"
              {...register("first_name")}
            />
            {errors.first_name && (
              <p className="mt-1 text-xs text-red-400">
                {errors.first_name.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="last_name"
              className="mb-1.5 block text-sm font-medium text-slate-300"
            >
              Last Name
            </label>
            <input
              id="last_name"
              type="text"
              placeholder="Doe"
              className="input-field"
              {...register("last_name")}
            />
            {errors.last_name && (
              <p className="mt-1 text-xs text-red-400">
                {errors.last_name.message}
              </p>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-slate-300"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="input-field"
            autoComplete="email"
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-slate-300"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Min. 6 characters"
              className="input-field pr-10"
              autoComplete="new-password"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-400">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Country */}
        <div>
          <label
            htmlFor="country"
            className="mb-1.5 block text-sm font-medium text-slate-300"
          >
            Country
          </label>
          <select
            id="country"
            className="input-field"
            {...register("country")}
          >
            <option value="">Select your country</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
          {errors.country && (
            <p className="mt-1 text-xs text-red-400">
              {errors.country.message}
            </p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label
            htmlFor="phone"
            className="mb-1.5 block text-sm font-medium text-slate-300"
          >
            Phone
          </label>
          <div className="flex gap-2">
            <span className="input-field w-20 shrink-0 text-center text-slate-400">
              {selectedCountryPhoneCode || "---"}
            </span>
            <input
              id="phone"
              type="tel"
              placeholder="Phone number"
              className="input-field"
              {...register("phone")}
            />
          </div>
        </div>

        {/* Profession */}
        <div>
          <label
            htmlFor="profession"
            className="mb-1.5 block text-sm font-medium text-slate-300"
          >
            Profession
          </label>
          <select
            id="profession"
            className="input-field"
            {...register("profession")}
          >
            <option value="">Select your profession</option>
            {professions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {errors.profession && (
            <p className="mt-1 text-xs text-red-400">
              {errors.profession.message}
            </p>
          )}
        </div>

        {/* License Number */}
        <div>
          <label
            htmlFor="license_number"
            className="mb-1.5 block text-sm font-medium text-slate-300"
          >
            License Number
          </label>
          <input
            id="license_number"
            type="text"
            placeholder="Professional license number"
            className="input-field"
            {...register("license_number")}
          />
          {errors.license_number && (
            <p className="mt-1 text-xs text-red-400">
              {errors.license_number.message}
            </p>
          )}
        </div>

        {/* Years of Experience */}
        <div>
          <label
            htmlFor="experience_years"
            className="mb-1.5 block text-sm font-medium text-slate-300"
          >
            Years of Experience
          </label>
          <input
            id="experience_years"
            type="number"
            min={0}
            max={60}
            placeholder="0"
            className="input-field"
            {...register("experience_years", { valueAsNumber: true })}
          />
          {errors.experience_years && (
            <p className="mt-1 text-xs text-red-400">
              {errors.experience_years.message}
            </p>
          )}
        </div>

        {/* Exam Interest */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Exam Interest
          </label>
          <div className="space-y-2">
            {examOptions.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-charcoal-600 bg-charcoal-800/50 px-4 py-2.5 transition-colors hover:border-teal-500/30"
              >
                <input
                  type="radio"
                  value={option.value}
                  className="h-4 w-4 accent-teal-500"
                  {...register("exam_interest")}
                />
                <span className="text-sm text-slate-300">{option.label}</span>
              </label>
            ))}
          </div>
          {errors.exam_interest && (
            <p className="mt-1 text-xs text-red-400">
              {errors.exam_interest.message}
            </p>
          )}
        </div>

        {/* Photo Upload */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">
            Professional Photo{" "}
            <span className="text-slate-500">(optional)</span>
          </label>

          {photoPreview ? (
            <div className="relative inline-block">
              <img
                src={photoPreview}
                alt="Preview"
                className="h-32 w-32 rounded-xl border border-charcoal-600 object-cover"
              />
              <button
                type="button"
                onClick={removePhoto}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                aria-label="Remove photo"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 transition-colors ${
                isDragActive
                  ? "border-teal-500 bg-teal-500/5"
                  : "border-charcoal-600 hover:border-teal-500/50 hover:bg-charcoal-800/50"
              } ${photoCompressing ? "pointer-events-none opacity-50" : ""}`}
            >
              <input {...getInputProps()} />
              {photoCompressing ? (
                <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
              ) : isDragActive ? (
                <Upload className="h-6 w-6 text-teal-500" />
              ) : (
                <ImageIcon className="h-6 w-6 text-slate-500" />
              )}
              <p className="text-center text-xs text-slate-500">
                {photoCompressing
                  ? "Compressing..."
                  : isDragActive
                    ? "Drop your photo here"
                    : "Drag & drop a photo, or click to browse"}
              </p>
              <span className="text-xs text-slate-600">
                PNG, JPG, or WEBP (max 10MB)
              </span>
            </div>
          )}
        </div>

        {/* Privacy Consent */}
        <div>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-teal-500"
              {...register("privacy_consent")}
            />
            <span className="text-xs leading-relaxed text-slate-400">
              He leído el{" "}
              <Link
                href="/privacy"
                target="_blank"
                className="text-teal-400 underline hover:text-teal-300"
              >
                Aviso de Privacidad
              </Link>{" "}
              y consiento libremente el uso de mis datos para fines
              acad&eacute;micos y de contacto laboral. No compartimos datos con
              terceros.
            </span>
          </label>
          {errors.privacy_consent && (
            <p className="mt-1 text-xs text-red-400">
              {errors.privacy_consent.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      {/* Login link */}
      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-teal-400 hover:text-teal-300">
          Sign in
        </Link>
      </p>
    </div>
  );
}
