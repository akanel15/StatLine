// Mock the dependencies first before any imports
import { shareBoxScoreImage, shareMultipleBoxScoreImages } from "../../utils/shareBoxScore";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { captureRef } from "react-native-view-shot";
import RNShare from "react-native-share";

jest.mock("expo-sharing");
jest.mock("react-native-view-shot");
jest.mock("expo-file-system");
jest.mock("react-native-share");
jest.mock("react-native", () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

const mockSharing = Sharing as jest.Mocked<typeof Sharing>;
const mockCaptureRef = captureRef as jest.MockedFunction<typeof captureRef>;
const mockFileSystem = FileSystem as jest.Mocked<typeof FileSystem>;
const mockRNShare = RNShare as jest.Mocked<typeof RNShare>;

describe("shareBoxScoreImage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should capture and share the box score image", async () => {
    // Mock the ref object
    const mockRef = { current: {} };

    // Mock Sharing.isAvailableAsync to return true
    mockSharing.isAvailableAsync.mockResolvedValue(true);

    // Mock captureRef to return a file URI
    mockCaptureRef.mockResolvedValue("file://path/to/image.png");

    // Mock Sharing.shareAsync to resolve successfully
    mockSharing.shareAsync.mockResolvedValue();

    const result = await shareBoxScoreImage(mockRef, "Test Game");

    expect(result).toBe(true);
    expect(mockSharing.isAvailableAsync).toHaveBeenCalled();
    expect(mockCaptureRef).toHaveBeenCalledWith(mockRef, {
      format: "png",
      quality: 0.9,
      result: "tmpfile",
    });
    expect(mockSharing.shareAsync).toHaveBeenCalledWith("file://path/to/image.png", {
      mimeType: "image/png",
      dialogTitle: "Share Test Game Box Score",
      UTI: "public.png",
    });
  });

  it("should return false when sharing is not available", async () => {
    const mockRef = { current: {} };

    // Mock Sharing.isAvailableAsync to return false
    mockSharing.isAvailableAsync.mockResolvedValue(false);

    const result = await shareBoxScoreImage(mockRef);

    expect(result).toBe(false);
    expect(mockCaptureRef).not.toHaveBeenCalled();
    expect(mockSharing.shareAsync).not.toHaveBeenCalled();
  });

  it("should handle errors gracefully", async () => {
    const mockRef = { current: {} };

    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    mockSharing.isAvailableAsync.mockResolvedValue(true);
    mockCaptureRef.mockRejectedValue(new Error("Capture failed"));

    const result = await shareBoxScoreImage(mockRef);

    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith("Error sharing box score:", expect.any(Error));

    consoleSpy.mockRestore();
  });
});

describe("shareMultipleBoxScoreImages", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should capture multiple images and share them via RNShare.open", async () => {
    const refs = [{ current: {} }, { current: {} }, { current: {} }];
    const fileNames = ["Team-vs-A.png", "Team-vs-B.png", "Team-vs-C.png"];

    mockCaptureRef
      .mockResolvedValueOnce("file://tmp/img1.png")
      .mockResolvedValueOnce("file://tmp/img2.png")
      .mockResolvedValueOnce("file://tmp/img3.png");

    const onProgress = jest.fn();
    const result = await shareMultipleBoxScoreImages(refs, fileNames, onProgress);

    expect(result).toBe(true);
    expect(mockCaptureRef).toHaveBeenCalledTimes(3);
    expect(mockFileSystem.copyAsync).toHaveBeenCalledTimes(3);
    expect(onProgress).toHaveBeenCalledTimes(3);
    expect(onProgress).toHaveBeenNthCalledWith(1, 1, 3);
    expect(onProgress).toHaveBeenNthCalledWith(2, 2, 3);
    expect(onProgress).toHaveBeenNthCalledWith(3, 3, 3);
    expect(mockRNShare.open).toHaveBeenCalledWith({
      urls: [
        "file://mock-directory/Team-vs-A.png",
        "file://mock-directory/Team-vs-B.png",
        "file://mock-directory/Team-vs-C.png",
      ],
      type: "image/png",
      failOnCancel: false,
    });
  });

  it("should stop early when cancelled and clean up partial files", async () => {
    const refs = [{ current: {} }, { current: {} }, { current: {} }];
    const fileNames = ["A.png", "B.png", "C.png"];

    mockCaptureRef.mockResolvedValue("file://tmp/img.png");

    const signal = { cancelled: false };
    const onProgress = jest.fn().mockImplementation((completed: number) => {
      if (completed === 1) {
        signal.cancelled = true;
      }
    });

    const result = await shareMultipleBoxScoreImages(refs, fileNames, onProgress, signal);

    expect(result).toBe(false);
    expect(mockCaptureRef).toHaveBeenCalledTimes(1);
    expect(mockRNShare.open).not.toHaveBeenCalled();
    // Should have cleaned up the one file that was created
    expect(mockFileSystem.deleteAsync).toHaveBeenCalledWith(
      "file://mock-directory/A.png",
      { idempotent: true },
    );
  });

  it("should clean up files after 30 seconds", async () => {
    const refs = [{ current: {} }];
    const fileNames = ["Game.png"];

    mockCaptureRef.mockResolvedValueOnce("file://tmp/img.png");

    await shareMultipleBoxScoreImages(refs, fileNames);

    expect(mockFileSystem.deleteAsync).toHaveBeenCalledTimes(1); // temp file cleanup

    jest.advanceTimersByTime(30000);

    // After 30s: temp cleanup (1) + scheduled cleanup (1) = 2
    expect(mockFileSystem.deleteAsync).toHaveBeenCalledTimes(2);
    expect(mockFileSystem.deleteAsync).toHaveBeenLastCalledWith(
      "file://mock-directory/Game.png",
      { idempotent: true },
    );
  });

  it("should handle capture errors gracefully", async () => {
    const refs = [{ current: {} }, { current: {} }];
    const fileNames = ["A.png", "B.png"];

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    mockCaptureRef.mockRejectedValue(new Error("Capture failed"));

    const result = await shareMultipleBoxScoreImages(refs, fileNames);

    expect(result).toBe(false);
    expect(mockRNShare.open).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error sharing multiple box scores:",
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });

  it("should use fallback filename when not provided", async () => {
    const refs = [{ current: {} }];
    const fileNames: string[] = [];

    mockCaptureRef.mockResolvedValueOnce("file://tmp/img.png");

    await shareMultipleBoxScoreImages(refs, fileNames);

    expect(mockFileSystem.copyAsync).toHaveBeenCalledWith({
      from: "file://tmp/img.png",
      to: "file://mock-directory/BoxScore-1.png",
    });
  });
});
