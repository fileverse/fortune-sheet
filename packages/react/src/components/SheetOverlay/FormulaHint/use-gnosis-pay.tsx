import { useEffect, useRef, useState } from "react";
import { GNOSIS_PAY_ACCESS } from "./constants";
import { formatTimeLeft, isExpired } from "./utils/utils";

const useGnosisPay = (fn: any) => {
  const gnosisTokenTokenIntervalRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasGnosisPayToken, setHasGnosisPayToken] = useState(false);
  const [timeLeft, setTimeLeft] = useState("00:00");
  const [accessTokenCreatedAt, setAccessTokenCreatedAt] = useState(0);
  const isWrongGnosisPayConnector =
    localStorage.getItem("LOGIN_METHOD") !== "walletAddress";

  const handleGnosisPayToken = (onDone?: () => void) => {
    if (localStorage.getItem(GNOSIS_PAY_ACCESS)) {
      const access = JSON.parse(localStorage.getItem(GNOSIS_PAY_ACCESS) || "");
      if (!access?.token || isExpired(access?.createdAt)) {
        if (hasGnosisPayToken) {
          setHasGnosisPayToken(false);
        }
        if (accessTokenCreatedAt) {
          setAccessTokenCreatedAt(0);
        }
        localStorage.removeItem(GNOSIS_PAY_ACCESS);
        return;
      }
      setHasGnosisPayToken(!!access.token);
      setAccessTokenCreatedAt(access.createdAt);
      onDone?.();
    } else {
      const urlParams = new URLSearchParams(window.location.search);
      const isRejected = urlParams.has("reject");
      if (isRejected) {
        const url = new URL(window.location.href);
        url.searchParams.delete("reject");
        window.history.replaceState({}, "", url.toString());
        onDone?.();
      }
    }
  };

  useEffect(() => {
    return () => {
      if (gnosisTokenTokenIntervalRef.current)
        clearInterval(gnosisTokenTokenIntervalRef.current);
    };
  }, [gnosisTokenTokenIntervalRef]);

  useEffect(() => {
    if (accessTokenCreatedAt <= 0) return () => {};

    const interval = setInterval(() => {
      const EXPIRY_DURATION_MS = 60 * 60 * 1000;
      const expiryTimestamp = accessTokenCreatedAt + EXPIRY_DURATION_MS;
      const newTimeLeft = expiryTimestamp - Date.now();
      setTimeLeft(formatTimeLeft(newTimeLeft));
      if (newTimeLeft <= 0 || !document.getElementById("gnosis-pay-area")) {
        clearInterval(interval);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [accessTokenCreatedAt, fn]);

  const grantAccess = () => {
    const button = document.getElementById("grant-gnosispay-access");
    if (!button) return;
    button.click();
    setIsLoading(true);
    const interval = setInterval(() => {
      handleGnosisPayToken(() => {
        clearInterval(interval);
        setIsLoading(false);
      });
    }, 5000);

    gnosisTokenTokenIntervalRef.current = interval;
  };

  return {
    grantAccess,
    handleGnosisPayToken,
    hasGnosisPayToken,
    isWrongGnosisPayConnector,
    isLoading,
    accessTokenCreatedAt,
    timeLeft,
  };
};

export default useGnosisPay;
