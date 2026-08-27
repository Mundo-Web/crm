import React, { useEffect, useState } from 'react';
import AuthRest from "../../actions/AuthRest";
import { toast } from "sonner";
import { Session } from "sode-extend-react";
import JoinSkeletonScene from "./JoinSkeletonScene";

const authRest = new AuthRest();

const JoinThanks = ({ data = {}, setData, step, setStep }) => {
  const [failed, setFailed] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const isPreview = typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).get('preview') === '1' ||
    new URLSearchParams(window.location.search).get('step') === 'saving'
  );

  const clearStorage = () => {
    try {
      Session.delete('join-data');
      Session.set('join-data', {});
      localStorage.removeItem('join-data');
      sessionStorage.removeItem('join-data');
    } catch (e) {
      console.error('Error clearing storage:', e);
    }
    if (setData) setData({});
  };

  const saveData = async () => {
    if (isPreview) return; // Do not submit to backend in preview mode
    setFailed(false);
    try {
      const startTime = Date.now();
      const { status, message } = await authRest.init(data);
      if (!status) {
        setFailed(true);
        toast(message || 'Ocurrió un error al inicializar', { icon: <i className="mdi mdi-alert" /> });
        return;
      }

      const elapsed = Date.now() - startTime;
      const remainingDelay = Math.max(0, 4500 - elapsed);

      setTimeout(() => {
        clearStorage();
        setStep('thanks');
      }, remainingDelay);
    } catch (error) {
      setFailed(true);
      toast('Error de conexión al inicializar la cuenta', { icon: <i className="mdi mdi-alert" /> });
    }
  };

  useEffect(() => {
    if (step === 'saving') {
      saveData();
    }

    if (step === 'thanks') {
      clearStorage();
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            window.location.href = '/leads?first_time=1';
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [step]);

  // ==============================================================
  //  SAVING STEP: Max-Width Clean White Skeleton Dashboard Preview
  // ==============================================================
  if (step === 'saving') {
    return (
      <div className="w-full flex flex-col items-center justify-center py-2 px-2">
        {/* Header note */}
        <div className="text-center mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EEF2FF] border border-[#DBE0FF] text-[#4621E1] rounded-full text-xs font-semibold mb-1 shadow-xs">
            <i className="mdi mdi-loading mdi-spin text-sm" />
            <span>Configurando tu espacio de trabajo en tiempo real</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Preparando tu <span className="text-[#FE4611]">CRM</span> y tableros
          </h2>
        </div>

        {/* Skeleton Frame with max width */}
        <div className="relative w-full max-w-4xl h-[480px] sm:h-[520px] rounded-2xl overflow-hidden border border-slate-200 bg-[#f8fafc] shadow-xl">
          <JoinSkeletonScene />
        </div>

        {failed && (
          <div className="mt-3">
            <button
              onClick={saveData}
              className="inline-flex items-center gap-2 border border-rose-500 bg-rose-600 hover:bg-rose-700 transition-colors font-semibold text-white rounded-xl py-2 px-5 text-xs shadow-md"
            >
              <i className="mdi mdi-refresh" />
              Reintentar guardar
            </button>
          </div>
        )}
      </div>
    );
  }

  // ==============================================================
  //  THANKS STEP: Compact, Clean Atalaya Welcome Card
  // ==============================================================
  return (
    <div className="h-full flex items-center justify-center py-6 px-4">
      <div className="bg-white rounded-2xl max-w-sm w-full mx-auto p-6 sm:p-8 text-center shadow-lg border border-gray-100">
        <i className="mdi mdi-check mdi-36px w-14 h-14 bg-[#DBE0FF] mx-auto mb-5 rounded-2xl flex items-center justify-center text-[#4621E1] shadow-inner" />

        <h2 className="text-3xl font-bold mb-3 text-gray-900 tracking-tight">
          ¡Bienvenido a <span className="text-[#FE4611]">Atalaya</span>!
        </h2>

        <p className="leading-relaxed mb-6 text-gray-600 text-sm">
          Tu cuenta ha sido configurada exitosamente. Estás listo para comenzar a gestionar tus clientes y hacer crecer tu negocio.
        </p>

        <div className="space-y-2 mb-6">
          <a
            href="/leads?first_time=1"
            className="w-full block border-2 border-[#4621E1] bg-[#4621E1] hover:bg-opacity-90 transition-colors font-semibold text-white rounded-xl py-3 px-6 text-sm shadow-sm"
          >
            Ir al CRM
          </a>
          <p className="text-xs text-gray-500 pt-1">
            Serás redirigido automáticamente en <span className="font-bold text-[#4621E1]">{countdown}</span> segundos
          </p>
        </div>

        <p className="leading-tight text-[#4621E1] text-xs">
          <span className="font-bold">💡 Próximos pasos:</span> Importa tus contactos existentes o comienza agregando tu primer lead.
        </p>
      </div>
    </div>
  );
};

export default JoinThanks;