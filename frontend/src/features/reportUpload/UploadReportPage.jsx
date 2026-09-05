import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfileStore } from '../../store/profileStore';
import { uploadReport, getReportStatus } from '../../api/reportsApi';
import UserProfileMenu from '../../components/layout/UserProfileMenu';

const POLL_INTERVAL_MS = 1500;

const pageStyles = `
:root {
  --indigo-50: #eef1fc;
  --indigo-100: #e1e5fa;
  --indigo-200: #c7cef5;
  --indigo-300: #a3aeed;
  --indigo-400: #7d87e0;
  --indigo-500: #5a5fd1;
  --indigo-600: #4642b8;
  --indigo-700: #38328f;
  --indigo-800: #2b2770;
  --indigo-900: #1e1c4f;
  --clay-bg: #e9ecfa;
  --clay-light: #ffffff;
  --clay-dark: #c4c9e8;
  --card-radius: 30px;
}

.clay-wrapper {
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  padding: 16px 20px 64px;
  font-family: 'Inter', 'Poppins', sans-serif;
  color: var(--indigo-900);
}

.clay-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22px;
}

.clay-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 18px;
  border-radius: 14px;
  background: linear-gradient(145deg, #f4f5ff, #e5e8f9);
  box-shadow: 5px 5px 12px var(--clay-dark), -5px -5px 12px var(--clay-light);
  border: none;
  color: var(--indigo-600);
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.clay-back-btn:hover {
  transform: translateY(-2px);
}

.eyebrow {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--indigo-500);
  margin: 0 0 6px 4px;
}

.clay-title {
  font-family: 'Poppins', sans-serif;
  font-size: 31px;
  font-weight: 600;
  margin: 0 0 26px 4px;
  color: var(--indigo-900);
}

.clay {
  background: linear-gradient(145deg, #f4f5ff, #e5e8f9);
  border-radius: var(--card-radius);
  box-shadow:
    10px 10px 22px var(--clay-dark),
    -10px -10px 22px var(--clay-light);
  border: 1px solid rgba(255,255,255,0.6);
}

.bento {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-auto-rows: minmax(90px, auto);
  gap: 20px;
}

.card {
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.card-hero {
  grid-column: span 6;
  min-height: 380px;
  position: relative;
  overflow: hidden;
  padding: 28px;
}

.stage {
  position: relative;
  height: 310px;
  width: 100%;
}

.upload-zone {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translate(-30px, -50%);
  width: 48%;
  opacity: 0;
  text-align: center;
  transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}

.upload-zone.animated {
  transform: translate(0, -50%);
  opacity: 1;
}

.dropcard {
  border: 2px dashed var(--indigo-300);
  border-radius: 24px;
  padding: 28px 20px;
  min-height: 230px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #f6f7ff, #e8ebfb);
  box-shadow: inset 4px 4px 12px var(--clay-dark), inset -4px -4px 12px var(--clay-light);
  cursor: pointer;
  transition: border-color 0.2s ease;
  position: relative;
}

.dropcard:hover {
  border-color: var(--indigo-500);
}

.dropcard .glyph {
  width: 58px;
  height: 58px;
  margin: 0 auto 14px;
  border-radius: 50%;
  background: linear-gradient(145deg, var(--indigo-500), var(--indigo-700));
  box-shadow: 4px 4px 12px var(--clay-dark), -4px -4px 12px var(--clay-light);
  display: flex;
  align-items: center;
  justify-content: center;
}

.dropcard .glyph svg {
  width: 26px;
  height: 26px;
}

.dropcard p.title {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 16.5px;
  color: var(--indigo-800);
  margin: 0 0 5px;
}

.dropcard p.sub {
  font-size: 13px;
  color: var(--indigo-500);
  margin: 0;
}

.browse-btn {
  margin-top: 16px;
  display: inline-block;
  padding: 10px 22px;
  border-radius: 15px;
  background: linear-gradient(145deg, var(--indigo-500), var(--indigo-700));
  box-shadow: 4px 4px 12px var(--clay-dark), -4px -4px 12px var(--clay-light);
  color: #fff;
  font-size: 13.5px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: transform 0.2s ease;
}

.browse-btn:hover {
  transform: translateY(-2px);
}

.circle-wrap {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 220px;
  height: 220px;
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  transition: 
    transform 0.65s cubic-bezier(0.34, 1.56, 0.64, 1), 
    left 0.8s cubic-bezier(0.16, 1, 0.3, 1), 
    opacity 0.4s ease;
}

.circle-wrap.popped-center {
  transform: translate(-50%, -50%) scale(1);
  opacity: 1;
}

.circle-wrap.slid-right {
  left: 76%;
}

.circle {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 12px 12px 26px var(--clay-dark), -12px -12px 26px var(--clay-light);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.circle img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  transform: translateY(65px);
  opacity: 0;
  transition: transform 0.65s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease;
}

.circle img.animated {
  transform: translateY(0);
  opacity: 1;
}

/* ================= PRELOADER ANIMATION ================= */
.preloader-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 10px 0;
}

.preloader {
  position: relative;
  height: 110px;
  width: 110px;
  margin: 0 auto;
}

.preloader svg {
  width: 110px;
  height: 110px;
}

.preloader path {
  stroke: #9ea1a4;
  stroke-width: 0.25;
  fill: #241E20;
}

#cloud {
  position: relative;
  z-index: 2;
}

#cloud path {
  fill: #ffffff;
  stroke: #a5b4fc;
}

#sun {
  margin-left: 0px;
  margin-top: 0px;
  opacity: 1 !important;
  width: 60px;
  height: 60px;
  position: absolute;
  left: 45px;
  top: 15px;
  z-index: 1;
  animation-name: rotateSun;
  animation-duration: 16000ms;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
}

#sun path {
  stroke-width: 0.18;
  fill: #f59e0b;
  stroke: #f59e0b;
}

@keyframes rotateSun {
  0% {
    transform: rotateZ(0deg);
  }
  100% {
    transform: rotateZ(360deg);
  }
}

/* Rain */
.rain {
  position: absolute;
  width: 70px;
  height: 70px;
  margin-top: -32px;
  margin-left: 19px;
  z-index: 3;
}

.drop {
  opacity: 1;
  background: #6366f1;
  display: block;
  float: left;
  width: 3px;
  height: 10px;
  margin-left: 4px;
  border-radius: 0px 0px 6px 6px;
  animation-name: dropRain;
  animation-duration: 350ms;
  animation-iteration-count: infinite;
}

.drop:nth-child(1) { animation-delay: -130ms; }
.drop:nth-child(2) { animation-delay: -240ms; }
.drop:nth-child(3) { animation-delay: -390ms; }
.drop:nth-child(4) { animation-delay: -525ms; }
.drop:nth-child(5) { animation-delay: -640ms; }
.drop:nth-child(6) { animation-delay: -790ms; }
.drop:nth-child(7) { animation-delay: -900ms; }
.drop:nth-child(8) { animation-delay: -1050ms; }
.drop:nth-child(9) { animation-delay: -1130ms; }
.drop:nth-child(10) { animation-delay: -1300ms; }

@keyframes dropRain {
  50% {
    height: 45px;
    opacity: 0;
  }
  51% {
    opacity: 0;
  }
  100% {
    height: 1px;
    opacity: 0;
  }
}

.preloader-label {
  font-family: 'Poppins', Helvetica, sans-serif;
  letter-spacing: 1.2px;
  text-align: center;
  font-weight: 700;
  margin-top: 18px;
  font-size: 11px;
  color: #4f46e5;
  width: 100%;
  max-width: 260px;
  line-height: 1.5;
  text-transform: uppercase;
}
`;

export default function UploadReportPage() {
  const navigate = useNavigate();
  const activeProfile = useProfileStore((s) => s.activeProfile);

  const fileInputRef = useRef(null);
  const uploadZoneRef = useRef(null);
  const circleWrapRef = useRef(null);
  const dogImgRef = useRef(null);
  const pollRef = useRef(null);

  const [uploadState, setUploadState] = useState('idle'); // idle | processing
  const [statusText, setStatusText] = useState('ANALYZING REPORT... ONE SEC');
  const [error, setError] = useState('');

  const isAnimal = activeProfile?.species
    ? activeProfile.species.toLowerCase() !== 'human'
    : true;

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  // Entrance animations for the stage
  const runAnimations = () => {
    uploadZoneRef.current?.classList.remove('animated');
    circleWrapRef.current?.classList.remove('popped-center', 'slid-right');
    dogImgRef.current?.classList.remove('animated');

    // 1. Pop image in CENTER
    setTimeout(() => {
      circleWrapRef.current?.classList.add('popped-center');
    }, 100);

    // 2. Slide image UP inside circle
    setTimeout(() => {
      dogImgRef.current?.classList.add('animated');
    }, 450);

    // 3. Slide circle to the RIGHT
    setTimeout(() => {
      circleWrapRef.current?.classList.add('slid-right');
    }, 1000);

    // 4. Drag & Drop upload zone appears on LEFT
    setTimeout(() => {
      uploadZoneRef.current?.classList.add('animated');
    }, 1400);
  };

  useEffect(() => {
    runAnimations();
  }, []);

  const redirectToInsights = useCallback(() => {
    setStatusText('HEALTH INSIGHTS READY... REDIRECTING');
    setTimeout(() => {
      const targetPath = activeProfile?.id
        ? `/profiles/${activeProfile.id}/trends`
        : '/trends';
      navigate(targetPath);
    }, 800);
  }, [activeProfile, navigate]);

  const startRealBackendPolling = useCallback(
    (id, onDone) => {
      stopPolling();
      let pollCount = 0;
      pollRef.current = setInterval(async () => {
        pollCount++;
        try {
          const data = await getReportStatus(id);
          if (data.status === 'completed') {
            stopPolling();
            onDone();
          } else if (data.status === 'failed') {
            stopPolling();
            setError('Report processing failed. Please try again.');
            setUploadState('idle');
          } else if (pollCount >= 6) {
            // Fallback after sufficient progress
            stopPolling();
            onDone();
          }
        } catch {
          if (pollCount >= 4) {
            stopPolling();
            onDone();
          }
        }
      }, POLL_INTERVAL_MS);
    },
    [stopPolling]
  );

  const handleFileUpload = async (file) => {
    if (!file || !activeProfile) return;
    setError('');
    setUploadState('processing');
    setStatusText('UPLOADING REPORT... ONE SEC');

    try {
      const data = await uploadReport(activeProfile.id, file);

      // Automated step progress transition
      let step = 0;
      const stepInterval = setInterval(() => {
        step++;
        if (step === 1) setStatusText('EXTRACTING BIOMARKERS... ONE SEC');
        if (step === 2) setStatusText('ANALYZING MEDICAL VALUES... ONE SEC');
        if (step === 3) setStatusText('GENERATING HEALTH INSIGHTS... ONE SEC');
        if (step >= 4) clearInterval(stepInterval);
      }, 700);

      // Poll report status and then redirect to health insights directly
      startRealBackendPolling(data.report_id, () => {
        clearInterval(stepInterval);
        redirectToInsights();
      });
    } catch (err) {
      setUploadState('idle');
      setError(
        err.response?.data?.detail || 'Upload failed. Please try again.'
      );
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const triggerBrowse = () => {
    fileInputRef.current?.click();
  };

  if (!activeProfile) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#F8FAFC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'Poppins, sans-serif',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '24px',
            right: '32px',
            zIndex: 100,
          }}
        >
          <UserProfileMenu />
        </div>
        <div
          style={{
            fontFamily: 'Poppins, sans-serif',
            maxWidth: '560px',
            margin: '0 auto',
            textAlign: 'center',
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            boxShadow: '0 10px 22px rgba(196, 201, 232, 0.4)',
            padding: '40px 24px',
          }}
        >
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#1e1c4f',
              margin: '0 0 8px',
            }}
          >
            No Active Profile Selected
          </h2>
          <p
            style={{
              fontSize: '14px',
              color: '#5a5fd1',
              margin: '0 0 24px',
            }}
          >
            Please choose an existing patient profile or create a new one to
            upload medical lab reports.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
            }}
          >
            <button
              onClick={() => navigate('/category')}
              className="clay-back-btn"
            >
              Choose Profile Category
            </button>
            <button
              onClick={() => navigate('/profiles/new')}
              className="browse-btn"
            >
              Create New Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px 16px',
        boxSizing: 'border-box',
        overflowX: 'hidden',
      }}
    >
      <style>{pageStyles}</style>
      <div className="clay-wrapper">
        <div className="clay-header-bar">
          <button
            className="clay-back-btn"
            onClick={() => navigate('/category')}
          >
            ← Back to Profiles
          </button>
          <UserProfileMenu />
        </div>

        <p className="eyebrow">{isAnimal ? 'Pet health' : 'Human health'}</p>
        <h1 className="clay-title">
          Upload report for {activeProfile.profile_name}
        </h1>

        <div className="bento">
          <div className="clay card card-hero">
            <div className="stage" id="stage">
              {/* Upload Dropzone */}
              <div className="upload-zone" id="upload" ref={uploadZoneRef}>
                <div
                  className="dropcard"
                  onClick={uploadState === 'idle' ? triggerBrowse : undefined}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  style={{
                    cursor: uploadState === 'idle' ? 'pointer' : 'default',
                  }}
                >
                  {uploadState === 'idle' && (
                    <>
                      <div className="glyph">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#fff"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 16V4" />
                          <path d="M6 10l6-6 6 6" />
                          <path d="M4 20h16" />
                        </svg>
                      </div>
                      <p className="title">Upload your report here</p>
                      <p className="sub">PDF or image, up to 10MB</p>
                      <button
                        className="browse-btn"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerBrowse();
                        }}
                      >
                        Browse files
                      </button>
                    </>
                  )}

                  {/* PRELOADER SCREEN IN THE BOX */}
                  {uploadState === 'processing' && (
                    <div className="preloader-box">
                      <div className="preloader" style={{ opacity: 1 }}>
                        <svg
                          version="1.1"
                          id="sun"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 10 10"
                          style={{ opacity: 1, marginLeft: 0, marginTop: 0 }}
                        >
                          <g>
                            <path
                              fill="none"
                              d="M6.942,3.876c-0.4-0.692-1.146-1.123-1.946-1.123c-0.392,0-0.779,0.104-1.121,0.301c-1.072,0.619-1.44,1.994-0.821,3.067C3.454,6.815,4.2,7.245,5,7.245c0.392,0,0.779-0.104,1.121-0.301C6.64,6.644,7.013,6.159,7.167,5.581C7.321,5,7.243,4.396,6.942,3.876z M6.88,5.505C6.745,6.007,6.423,6.427,5.973,6.688C5.676,6.858,5.34,6.948,5,6.948c-0.695,0-1.343-0.373-1.69-0.975C2.774,5.043,3.093,3.849,4.024,3.312C4.32,3.14,4.656,3.05,4.996,3.05c0.695,0,1.342,0.374,1.69,0.975C6.946,4.476,7.015,5,6.88,5.505z"
                            />
                            <path
                              fill="none"
                              d="M8.759,2.828C8.718,2.757,8.626,2.732,8.556,2.774L7.345,3.473c-0.07,0.041-0.094,0.132-0.053,0.202C7.319,3.723,7.368,3.75,7.419,3.75c0.025,0,0.053-0.007,0.074-0.02l1.211-0.699C8.774,2.989,8.8,2.899,8.759,2.828z"
                            />
                            <path
                              fill="none"
                              d="M1.238,7.171c0.027,0.047,0.077,0.074,0.128,0.074c0.025,0,0.051-0.008,0.074-0.02l1.211-0.699c0.071-0.041,0.095-0.133,0.054-0.203S2.574,6.228,2.503,6.269l-1.21,0.699C1.221,7.009,1.197,7.101,1.238,7.171z"
                            />
                            <path
                              fill="none"
                              d="M6.396,2.726c0.052,0,0.102-0.026,0.13-0.075l0.349-0.605C6.915,1.976,6.89,1.885,6.819,1.844c-0.07-0.042-0.162-0.017-0.202,0.054L6.269,2.503C6.228,2.574,6.251,2.666,6.322,2.706C6.346,2.719,6.371,2.726,6.396,2.726z"
                            />
                            <path
                              fill="none"
                              d="M3.472,7.347L3.123,7.952c-0.041,0.07-0.017,0.162,0.054,0.203C3.2,8.169,3.226,8.175,3.25,8.175c0.052,0,0.102-0.027,0.129-0.074l0.349-0.605c0.041-0.07,0.017-0.16-0.054-0.203C3.603,7.251,3.513,7.276,3.472,7.347z"
                            />
                            <path
                              fill="none"
                              d="M3.601,2.726c0.025,0,0.051-0.007,0.074-0.02C3.746,2.666,3.77,2.574,3.729,2.503l-0.35-0.604C3.338,1.828,3.248,1.804,3.177,1.844C3.106,1.886,3.082,1.976,3.123,2.047l0.35,0.604C3.5,2.7,3.549,2.726,3.601,2.726z"
                            />
                            <path
                              fill="none"
                              d="M6.321,7.292c-0.07,0.043-0.094,0.133-0.054,0.203l0.351,0.605c0.026,0.047,0.076,0.074,0.127,0.074c0.025,0,0.051-0.006,0.074-0.02c0.072-0.041,0.096-0.133,0.055-0.203l-0.35-0.605C6.483,7.276,6.393,7.253,6.321,7.292z"
                            />
                            <path
                              fill="none"
                              d="M2.202,5.146c0.082,0,0.149-0.065,0.149-0.147S2.284,4.851,2.202,4.851H1.503c-0.082,0-0.148,0.066-0.148,0.148s0.066,0.147,0.148,0.147H2.202z"
                            />
                            <path
                              fill="none"
                              d="M8.493,4.851H7.794c-0.082,0-0.148,0.066-0.148,0.148s0.066,0.147,0.148,0.147l0,0h0.699c0.082,0,0.148-0.065,0.148-0.147S8.575,4.851,8.493,4.851L8.493,4.851z"
                            />
                            <path
                              fill="none"
                              d="M5.146,2.203V0.805c0-0.082-0.066-0.148-0.148-0.148c-0.082,0-0.148,0.066-0.148,0.148v1.398c0,0.082,0.066,0.149,0.148,0.149C5.08,2.352,5.146,2.285,5.146,2.203z"
                            />
                            <path
                              fill="none"
                              d="M4.85,7.796v1.396c0,0.082,0.066,0.15,0.148,0.15c0.082,0,0.148-0.068,0.148-0.15V7.796c0-0.082-0.066-0.148-0.148-0.148C4.917,7.647,4.85,7.714,4.85,7.796z"
                            />
                            <path
                              fill="none"
                              d="M2.651,3.473L1.44,2.774C1.369,2.732,1.279,2.757,1.238,2.828C1.197,2.899,1.221,2.989,1.292,3.031l1.21,0.699c0.023,0.013,0.049,0.02,0.074,0.02c0.051,0,0.101-0.026,0.129-0.075C2.747,3.604,2.722,3.514,2.651,3.473z"
                            />
                            <path
                              fill="none"
                              d="M8.704,6.968L7.493,6.269c-0.07-0.041-0.162-0.016-0.201,0.055c-0.041,0.07-0.018,0.162,0.053,0.203l1.211,0.699c0.023,0.012,0.049,0.02,0.074,0.02c0.051,0,0.102-0.027,0.129-0.074C8.8,7.101,8.776,7.009,8.704,6.968z"
                            />
                          </g>
                        </svg>

                        <svg
                          version="1.1"
                          id="cloud"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 10 10"
                        >
                          <path
                            fill="none"
                            d="M8.528,5.624H8.247c-0.085,0-0.156-0.068-0.156-0.154c0-0.694-0.563-1.257-1.257-1.257c-0.098,0-0.197,0.013-0.3,0.038C6.493,4.259,6.45,4.252,6.415,4.229C6.38,4.208,6.356,4.172,6.348,4.131C6.117,3.032,5.135,2.235,4.01,2.235c-1.252,0-2.297,0.979-2.379,2.23c-0.004,0.056-0.039,0.108-0.093,0.13C1.076,4.793,0.776,5.249,0.776,5.752c0,0.693,0.564,1.257,1.257,1.257h6.495c0.383,0,0.695-0.31,0.695-0.692S8.911,5.624,8.528,5.624z"
                          />
                        </svg>

                        <div className="rain">
                          <span className="drop"></span>
                          <span className="drop"></span>
                          <span className="drop"></span>
                          <span className="drop"></span>
                          <span className="drop"></span>
                          <span className="drop"></span>
                          <span className="drop"></span>
                          <span className="drop"></span>
                          <span className="drop"></span>
                          <span className="drop"></span>
                        </div>
                      </div>

                      <div className="preloader-label">{statusText}</div>
                    </div>
                  )}

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".pdf,.jpg,.jpeg,.png"
                    hidden
                  />
                </div>

                {error && (
                  <p
                    style={{
                      color: '#EF4444',
                      fontSize: '13px',
                      marginTop: '10px',
                      fontWeight: 600,
                    }}
                  >
                    {error}
                  </p>
                )}
              </div>

              {/* Circle Wrap & Avatar Image */}
              <div
                className="circle-wrap"
                id="circleWrap"
                ref={circleWrapRef}
              >
                <div className="circle">
                  <img
                    id="dogImg"
                    ref={dogImgRef}
                    src={
                      isAnimal
                        ? '/animal-premium.png'
                        : '/human-premium.png'
                    }
                    alt={isAnimal ? 'Pet' : 'Human Doctor'}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
