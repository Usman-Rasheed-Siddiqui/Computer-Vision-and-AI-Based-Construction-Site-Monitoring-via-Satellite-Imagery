"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  MapPin,
  Calendar,
  Compass,
  ArrowRight,
  ArrowLeft,
  Search,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import DashboardNav from "../components/DashboardNav";
import { SmoothInput } from "../components/SmoothInput";
import {
  previewSatelliteImage,
  confirmSiteRegistration,
  discardSatellitePreview,
} from "../api/sites";
import type { SatellitePreviewResponse } from "../types/site";

interface FormState {
  site_name: string;
  location: string;
  city: string;
  country: string;
  area: string;
  start_date: string;
  latitude: string;
  longitude: string;
  extent_meters: string;
  is_public: boolean;
}

export default function RegisterSitePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Preview State Management using the typed response
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState<SatellitePreviewResponse | null>(null);

  const [formData, setFormData] = useState<FormState>({
    site_name: "",
    location: "",
    city: "",
    country: "",
    area: "",
    start_date: new Date().toISOString().split("T")[0],
    latitude: "",
    longitude: "",
    extent_meters: "500",
    is_public: false,
  });

  const handleChange = (field: keyof FormState, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errorMessage) setErrorMessage(null);
  };

  const validateStep1 = (): boolean => {
    if (!formData.site_name.trim()) {
      setErrorMessage("Construction site name is required.");
      return false;
    }
    if (!formData.start_date) {
      setErrorMessage("Start date is required.");
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setErrorMessage("Latitude must be a valid number between -90 and 90.");
      return false;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setErrorMessage("Longitude must be a valid number between -180 and 180.");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  // Phase 1: Call the new API wrapper for previewing satellite image
  const handleSearchSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const data = await previewSatelliteImage({
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        extent_meters: 500,
      });

      setPreviewData(data);
      setShowPreviewModal(true);
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.detail || "Failed to fetch satellite preview. Check your coordinates."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Phase 2A: Call confirm registration API wrapper on approval
  const handleApproveRegistration = async () => {
    setIsSubmitting(true);
    try {
      await confirmSiteRegistration({
        site_name: formData.site_name.trim(),
        start_date: formData.start_date,
        location: formData.location.trim() || undefined,
        city: formData.city.trim() || undefined,
        country: formData.country.trim() || undefined,
        area: formData.area ? parseFloat(formData.area) : undefined,
        is_public: formData.is_public,
        center_coordinates: {
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
        },
        extent_meters: 500,
        temp_image_path: previewData?.file_path,
      });

      navigate(`/construction-site/member`);
    } catch (err: any) {
      setErrorMessage("Failed to save site registration to database.");
      setShowPreviewModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Phase 2B: Call discard API wrapper on rejection to clean up temp storage
  const handleRejectRegistration = async () => {
    if (previewData?.file_path) {
      try {
        await discardSatellitePreview(previewData.file_path);
      } catch (err) {
        console.error("Failed to delete temp file:", err);
      }
    }
    setShowPreviewModal(false);
    setPreviewData(null);
  };

  return (
    <section className="relative w-full min-h-screen bg-[#080A19] text-white">
      <div className="relative z-10 flex flex-col min-h-screen">
        <DashboardNav />

        <main className="flex-1 flex flex-col items-center justify-center px-5 sm:px-8 md:px-[82px] py-12">
          {/* Header */}
          <div className="text-center mb-10 max-w-xl">
            <span className="text-[#4ADE80] text-xs uppercase tracking-widest font-mono mb-2 inline-block">
              Step {step} of 2
            </span>
            <h1 className="text-white text-[32px] sm:text-[48px] font-normal leading-[1.1] mb-3">
              Register Construction Site
            </h1>
            <p className="text-white/60 text-[15px] sm:text-[17px]">
              {step === 1
                ? "Enter initial metadata, locations, and timeframe for your site."
                : "Provide satellite bounding-box coordinates and radius constraints."}
            </p>
          </div>

          {/* Stepper Progress Bar */}
          <div className="w-full max-w-[560px] mb-8 flex items-center gap-2">
            <div className={`h-1 flex-1 rounded-full transition-colors duration-300 ${step >= 1 ? "bg-[#15803D]" : "bg-white/10"}`} />
            <div className={`h-1 flex-1 rounded-full transition-colors duration-300 ${step === 2 ? "bg-[#15803D]" : "bg-white/10"}`} />
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="w-full max-w-[560px] mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form Container */}
          <div className="w-full max-w-[560px] bg-[rgba(10,20,35,0.6)] backdrop-blur-[20px] border border-[#15803D]/20 rounded-[24px] p-6 sm:p-8">
            <form onSubmit={step === 2 ? handleSearchSite : (e) => e.preventDefault()}>
              <AnimatePresence mode="wait">
                {step === 1 ? (
                  <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }} className="space-y-5">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-white/70 mb-2 font-medium flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-[#4ADE80]" /> Site Name *
                      </label>
                      <SmoothInput
                        placeholder="e.g. Skyline Residency Tower B"
                        value={formData.site_name}
                        onChange={(e) => handleChange("site_name", e.target.value)}
                        wrapperClassName="max-w-none bg-white/[0.03] border border-white/10"
                        className="text-white text-lg"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-white/70 mb-2 font-medium flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#4ADE80]" /> Address / Location
                        </label>
                        <SmoothInput placeholder="Plot 42, Block 6" value={formData.location} onChange={(e) => handleChange("location", e.target.value)} wrapperClassName="max-w-none bg-white/[0.03] border border-white/10" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-white/70 mb-2 font-medium">City</label>
                        <SmoothInput placeholder="Karachi" value={formData.city} onChange={(e) => handleChange("city", e.target.value)} wrapperClassName="max-w-none bg-white/[0.03] border border-white/10" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-white/70 mb-2 font-medium">Country</label>
                        <SmoothInput placeholder="Pakistan" value={formData.country} onChange={(e) => handleChange("country", e.target.value)} wrapperClassName="max-w-none bg-white/[0.03] border border-white/10" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-white/70 mb-2 font-medium">Area (sqkm)</label>
                        <SmoothInput type="text" placeholder="8450" value={formData.area} onChange={(e) => handleChange("area", e.target.value)} wrapperClassName="max-w-none bg-white/[0.03] border border-white/10" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-white/70 mb-2 font-medium flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#4ADE80]" /> Start Date *
                      </label>
                      <input type="date" value={formData.start_date} onChange={(e) => handleChange("start_date", e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-[#15803D] transition-colors" />
                    </div>

                    <div className="pt-4">
                      <button type="button" onClick={handleNext} className="w-full h-[50px] bg-[#15803D] hover:bg-[#166534] rounded-[12px] text-white font-medium flex items-center justify-center gap-2 transition-colors shadow-lg shadow-[#15803D]/20">
                        Next: Coordinates & Radius <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-white/70 mb-2 font-medium flex items-center gap-2">
                          <Compass className="w-3.5 h-3.5 text-[#4ADE80]" /> Latitude * (-90 to 90)
                        </label>
                        <SmoothInput placeholder="24.8607" value={formData.latitude} onChange={(e) => handleChange("latitude", e.target.value)} wrapperClassName="max-w-none bg-white/[0.03] border border-white/10" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-white/70 mb-2 font-medium flex items-center gap-2">
                          <Compass className="w-3.5 h-3.5 text-[#4ADE80]" /> Longitude * (-180 to 180)
                        </label>
                        <SmoothInput placeholder="67.0011" value={formData.longitude} onChange={(e) => handleChange("longitude", e.target.value)} wrapperClassName="max-w-none bg-white/[0.03] border border-white/10" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-white/70 mb-2 font-medium">Extent Radius in Meters *</label>
                      <SmoothInput 
                        placeholder="500" 
                        value={formData.extent_meters} 
                        onChange={() => {}} 
                        readOnly={true}
                        wrapperClassName="max-w-none bg-white/[0.03] border border-white/10 opacity-60 cursor-not-allowed" 
                      />
                    </div>

                    <div className="pt-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={formData.is_public} onChange={(e) => handleChange("is_public", e.target.checked)} className="w-5 h-5 accent-[#15803D] rounded cursor-pointer" />
                        <span className="text-sm text-white/80">Make site publicly visible to collaborators</span>
                      </label>
                    </div>

                    <div className="pt-4 flex items-center gap-3">
                      <button type="button" onClick={() => setStep(1)} className="h-[50px] px-5 rounded-[12px] border border-white/20 text-white/80 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
                        <ArrowLeft className="w-4 h-4" /> Back
                      </button>

                      <button type="submit" disabled={isSubmitting} className="flex-1 h-[50px] bg-[#15803D] hover:bg-[#166534] disabled:bg-[#15803D]/50 rounded-[12px] text-white font-medium flex items-center justify-center gap-2 transition-colors shadow-lg shadow-[#15803D]/20 cursor-pointer">
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Fetching Satellite View...</span>
                          </>
                        ) : (
                          <>
                            <Search className="w-4 h-4" />
                            <span>Search Site & Preview</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>
        </main>
      </div>

      {/* SATELLITE PREVIEW & APPROVAL MODAL */}
      {showPreviewModal && previewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#0B132B] border border-[#15803D]/40 rounded-3xl p-6 max-w-lg w-full shadow-2xl text-center space-y-4">
            <h3 className="text-2xl font-semibold text-white">Approve Satellite View</h3>
            <p className="text-sm text-white/60">
              Inspect the extracted crop from ArcGIS Wayback for your coordinates. Is this the correct location?
            </p>

            <div className="rounded-xl overflow-hidden border border-white/10 max-h-[300px] bg-black/40 flex items-center justify-center">
              <img src={previewData.signed_url} alt="Site Satellite Preview" className="w-full h-auto object-contain" />
            </div>

            <div className="text-xs text-white/40 font-mono">
              Release Date: {previewData.info.release_date} | Resolution: {previewData.info.center_mpp} m/px
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleRejectRegistration}
                disabled={isSubmitting}
                className="flex-1 h-12 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <XCircle className="w-4 h-4" /> Re-enter Coordinates
              </button>

              <button
                type="button"
                onClick={handleApproveRegistration}
                disabled={isSubmitting}
                className="flex-1 h-12 bg-[#15803D] hover:bg-[#166534] text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-lg shadow-[#15803D]/30"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Approve & Register
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
}