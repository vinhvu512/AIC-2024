import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import ModalHeader from "./ModalHeader";
import VideoControls from "./VideoControls";
import QueryAndQnAContent from "./QueryAndQnAContent";
import AdditionalQnAContent from "./AdditionalQnAContent";
import SubmissionControls from "./SubmissionControls";

const Modal = ({
  children,
  onClose,
  bgColor,
  videoName,
  frameNumber,
  fusedScore,
  allFrames,
  currentIndex,
  timestamp,
  frameIndex,
  fps,
  isQueryAndQnA = false,
}) => {
  const [currentModalIndex, setCurrentModalIndex] = useState(currentIndex);
  const [sceneAnswer, setSceneAnswer] = useState("");
  const [newSceneAnswer, setNewSceneAnswer] = useState("");
  const [videoAnswer, setVideoAnswer] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [finalAnswer, setFinalAnswer] = useState("Final");
  const [isCopied, setIsCopied] = useState(false);
  const [currentVideoTime, setCurrentVideoTime] = useState(timestamp);
  const [tempFrameIndex, setTempFrameIndex] = useState(Number(frameIndex));
  const [range, setRange] = useState(1000);
  const [evaluationIdKis] = useState("69ec2262-d829-4ac1-94a2-1aa0a6693266");
  const [evaluationIdQnA] = useState("bec3b699-bdea-4f2c-94ae-61ee065fa76e");
  const [sessionId] = useState("n3q-d82-hihH1Jedq3hDd2w62ipTxsO6");
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [qnaSubmissionStatus, setQnaSubmissionStatus] = useState(null);
  const videoRef = useRef(null);

  const handleSubmit = async () => {
    setSubmissionStatus("submitting");
    const calculatedStartTime = Math.floor(
      Math.max(0, currentVideoTime * 1000 - range)
    );
    const calculatedEndTime = Math.floor(
      Math.min(currentVideoTime * 1000 + range, videoRef.current?.duration)
    );

    const body = {
      answerSets: [
        {
          answers: [
            {
              mediaItemName: videoName,
              start: calculatedStartTime,
              end: calculatedEndTime,
            },
          ],
        },
      ],
    };

    try {
      console.log(body);
      const response = await fetch(
        `https://eventretrieval.one/api/v2/submit/${evaluationIdKis}?session=${sessionId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionId}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setSubmissionStatus("success");
      return response;
    } catch (error) {
      console.error("Error submitting answer:", error);
      setSubmissionStatus("error");
      throw error;
    }
  };

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleTimeUpdate = (newTime) => {
    setCurrentVideoTime(newTime);
    setTempFrameIndex(Math.floor(newTime * fps));
  };

  const handleNext = () => {
    setCurrentModalIndex((prevIndex) => (prevIndex + 1) % allFrames.length);
  };

  const handlePrevious = () => {
    setCurrentModalIndex(
      (prevIndex) => (prevIndex - 1 + allFrames.length) % allFrames.length
    );
  };

  const handleGetSceneAnswer = () => setSceneAnswer("Scene answer placeholder");
  const handleGetVideoAnswer = () => setVideoAnswer("Video answer placeholder");
  const handleGetNewSceneAnswer = () =>
    setNewSceneAnswer("New scene answer placeholder");

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      } else if (event.shiftKey && !event.metaKey && !event.ctrlKey) {
        if (event.key === "ArrowRight") {
          handleNext();
        } else if (event.key === "ArrowLeft") {
          handlePrevious();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const currentFrame = allFrames[currentModalIndex];
  const currentFrameNumber =
    currentFrame?.path?.match(/frame_(\d{4})_/)?.[1] || frameNumber;

  const copyVideoInfo = () => {
    const info = `Video ${videoName} Frame: ${currentFrameNumber} Time: ${formatTime(
      currentVideoTime
    )} FPS: ${fps}`;
    navigator.clipboard.writeText(info);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleQnASubmit = async (answer) => {
    setQnaSubmissionStatus("submitting");
    const body = {
      answerSets: [
        {
          answers: [
            {
              text: `${answer}-${videoName}-${Math.floor(
                currentVideoTime * 1000
              )}`,
            },
          ],
        },
      ],
    };

    try {
      console.log(body);
      const response = await fetch(
        `https://eventretrieval.one/api/v2/submit/${evaluationIdQnA}?session=${sessionId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionId}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setQnaSubmissionStatus("success");
      return response;
    } catch (error) {
      console.error("Error submitting Q&A answer:", error);
      setQnaSubmissionStatus("error");
      throw error;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className={`${bgColor} p-6 rounded-lg relative ${
          isQueryAndQnA ? "max-w-7xl" : "max-w-5xl"
        } w-full`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-xl font-bold text-gray-700 hover:text-gray-900"
        >
          &times;
        </button>

        <ModalHeader
          videoName={videoName}
          tempFrameIndex={tempFrameIndex}
          currentVideoTime={currentVideoTime}
          fusedScore={fusedScore}
          isCopied={isCopied}
          copyVideoInfo={copyVideoInfo}
          isQueryAndQnA={isQueryAndQnA}
          handleGetSceneAnswer={handleGetSceneAnswer}
          handleGetVideoAnswer={handleGetVideoAnswer}
        />

        {isQueryAndQnA ? (
          <QueryAndQnAContent
            timestamp={timestamp}
            frameIndex={frameIndex}
            handleTimeUpdate={handleTimeUpdate}
            videoRef={videoRef}
            sceneAnswer={sceneAnswer}
            videoAnswer={videoAnswer}
          >
            {children}
          </QueryAndQnAContent>
        ) : (
          <VideoControls
            timestamp={timestamp}
            frameIndex={frameIndex}
            handleTimeUpdate={handleTimeUpdate}
            videoRef={videoRef}
          >
            {children}
          </VideoControls>
        )}

        {isQueryAndQnA && (
          <AdditionalQnAContent
            newSceneAnswer={newSceneAnswer}
            handleGetNewSceneAnswer={handleGetNewSceneAnswer}
            finalAnswer={finalAnswer}
          />
        )}

        <SubmissionControls
          range={range}
          setRange={setRange}
          handleSubmit={handleSubmit}
          handleQnASubmit={handleQnASubmit}
          submissionStatus={submissionStatus}
          qnaSubmissionStatus={qnaSubmissionStatus}
          videoName={videoName}
          currentVideoTime={currentVideoTime}
        />
      </div>
    </div>
  );
};

Modal.propTypes = {
  children: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
  bgColor: PropTypes.string.isRequired,
  videoName: PropTypes.string.isRequired,
  frameNumber: PropTypes.string.isRequired,
  fusedScore: PropTypes.number.isRequired,
  allFrames: PropTypes.array.isRequired,
  currentIndex: PropTypes.number.isRequired,
  timestamp: PropTypes.number,
  frameIndex: PropTypes.string,
  fps: PropTypes.number,
  isQueryAndQnA: PropTypes.bool,
};

export default Modal;
