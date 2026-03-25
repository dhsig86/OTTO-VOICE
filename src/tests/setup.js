import '@testing-library/jest-dom';

// Mock da Web Speech API — não existe no jsdom
class MockSpeechSynthesisUtterance {
  constructor(text) { this.text = text; this.pitch = 1; this.rate = 1; this.volume = 1; }
}

global.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
global.speechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getVoices: vi.fn(() => []),
  speaking: false,
  paused: false,
  onvoiceschanged: null,
};

// Mock do MediaRecorder
class MockMediaRecorder {
  constructor() { this.state = 'inactive'; }
  start()  { this.state = 'recording'; }
  stop()   { this.state = 'inactive'; if (this.onstop) this.onstop(); }
  addEventListener() {}
}

global.MediaRecorder = MockMediaRecorder;
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// Navigator mediaDevices mock
Object.defineProperty(global.navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    }),
  },
});
