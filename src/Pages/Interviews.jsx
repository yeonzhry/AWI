import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import Header from '../components/Header/Header';
import girlInterview from '../assets/girl-interview.svg';
import nextIcon from '../assets/next.svg';
import pastIcon from '../assets/past.svg';
import spotBeamArt from '../assets/spotBeam.svg';
import startIcon from '../assets/start.svg';
import pauseIcon from '../assets/pause.svg';
import part1Video from '../assets/video/part1.mp4';
import part2Video from '../assets/video/part2.mp4';
import part3Video from '../assets/video/part3.mp4';
import part1Thumb from '../assets/part1-thumb.jpg';
import part2Thumb from '../assets/part2-thumb.jpg';
import part3Thumb from '../assets/part3-thumb.jpg';

// TODO: only Part 1's credits were legible enough (in the zoomed screenshot)
// to transcribe exactly — Part 2/3 crew/interviewee entries below are
// placeholders in the same shape. Swap in the real names once you have them.
const PARTS = [
  {
    label: 'Part 1',
    title: '우리는 왜 추모하지 못할까?',
    description:
      '기억하고 싶은 마음은 있지만, 그 마음이 행동으로 이어지기까지는 여러 장벽이 있었습니다.\n무엇을 해야 할지 모르는 막막함, 바쁜 일상 속에서의 심리적인 부담, 함께할 사람을 찾기 어려운 현실까지.\n<소녀에게> 팀은 그 이유를 청년 세대에게 직접 물어보았습니다.',
    video: part1Video,
    poster: part1Thumb,
    credits: {
      crew: { role: '인터뷰 진행/촬영/편집', name: '원예솔' },
      interviewees: [
        { name: '최0수', age: '24세', job: '취준생' },
        { name: '김0현', age: '24세', job: '대학생' },
        { name: '정0원', age: '22세', job: '대학생' }
      ],
    },
  },
  {
    label: 'Part 2',
    title: '온라인에서도 연대가 시작될 수 있을까?',
    description: '그렇다면 추모의 공간을 조금 다르게 만들 수 있을까요?\n〈소녀에게〉 팀은 온라인에서 꽃과 편지를 남기고, 다른 사람들의 추모 메시지를 함께 보는 경험이 기억과 연대의 새로운 시작점이 될 수 있을지 물어보았습니다.\n온라인 추모관이 오프라인 추모를 대체하기보다, 더 많은 사람들이 부담 없이 참여하고 서로의 기억을 확인할 수 있는 입구가 되기를 기대합니다.',
    video: part2Video,
    poster: part2Thumb,
    credits: {
      crew: { role: '인터뷰 진행/촬영/편집', name: '원예솔' },
      interviewees: [
        { name: '최0수', age: '24세', job: '취준생' },
        { name: '김0현', age: '24세', job: '대학생' },
        { name: '정0원', age: '22세', job: '대학생' }
      ],
    },
  },
  {
    label: 'Part 3',
    title: 'PART 3. 기억은 왜 일상에서 멀어질까',
    description: '학창 시절, 역사동아리에서 추모 행사를 직접 기획할 만큼 적극적으로 기억하고 행동했던 수아.\n하지만 성인이 된 뒤, 학업과 일상에 치이면서 추모 활동은 자연스럽게 삶의 뒤편으로 밀려났습니다.\n\n기억해야 한다는 마음은 남아 있었지만, 기억할 계기가 점점 사라지고 있었습니다. 우리는 이 이야기를 통해 묻고자 합니다.\n기억을 지속하게 만드는 것은 개인의 의지일까요, 아니면 기억할 수 있는 환경일까요?',
    video: part3Video,
    poster: part3Thumb,
    credits: {
      crew: { role: '인터뷰 진행/촬영/편집', name: '원예솔' },
      interviewees: [{ name: '유수아', age: '24세', job: '직장인' }],
    },
  },
];

const PageBg = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, var(--neutral-10) 0%, var(--bg-secondary) 100%);
`;

const Stage = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8rem 2rem 4rem;
  gap: 1.5rem;

  @media (max-width: 640px) {
    padding: 6rem 1.25rem 3rem;
    margin-top: 5rem;
  }
`;

const StageRow = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

// Same show-one-side-only nav pattern as the About page's book flip: only
// the relevant arrow renders (not just disabled), sitting half on/off the
// video frame's edge.
const NavButton = styled.button`
  position: absolute;
  top: 33%;
  transform: translateY(-50%);
  z-index: 5;
  display: block;
  border: none;
  background: none;
  padding: 0;
  line-height: 0;
  cursor: pointer;

   img {
    width: 40px;
    height: 40px;
  }

  img {
      width: 24px;
      height: 24px;
    }

  
`;

const PrevButton = styled(NavButton)`
  left: -5rem;

  @media (max-width: 640px) {
    left: -2rem;
    margin-top: 0.5rem;

  }
`;

const NextButton = styled(NavButton)`
  right: -5rem;

  @media (max-width: 640px) {
    right: -2rem;
    margin-top: 0.5rem;
  }
`;

const VideoWrap = styled.div`
  width: 56rem;
  max-width: 80vw;
  margin-top: 3rem;

  @media (max-width: 640px) {
    margin-top: 2rem;
  }
`;

const VideoFrame = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
  box-shadow: 0 0 40px 0 rgba(255, 254, 240, 0.60);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const VideoEl = styled.video`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

// start.svg / pause.svg are both complete ready-made 56×56 buttons (circle +
// icon), same idea as next.svg/past.svg — just swap which one sits on top of
// the video, no extra styling needed.
const PlayPauseButton = styled.button`
  position: relative;
  z-index: 1;
  display: block;
  border: none;
  background: none;
  padding: 0;
  line-height: 0;
  cursor: pointer;

   img {
    width: 40px;
    height: 40px;
  }

  @media (max-width: 640px) {
    img {
      width: 24px;
      height: 24px;
    }

  }
`;

// Pause button + seek bar only fade in on hover, like a normal video player
// — but only once playback has started. The initial "start" button stays
// outside this layer so it's always visible before the video ever plays.
const HoverControls = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;

  ${VideoFrame}:hover & {
    opacity: 1;
    pointer-events: auto;
  }
`;

const SeekBar = styled.div`
  position: absolute;
  left: 0.75rem;
  right: 0.75rem;
  bottom: 0.75rem;
  height: 0.3rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.25);
  cursor: pointer;
`;

const SeekBarFill = styled.div`
  height: 100%;
  border-radius: 999px;
  background: var(--yellow-100, #fffef0);
`;

// The exact beam shape/gradient supplied (spotBeam.svg) — flares out wider
// at the bottom than the top. Sized a bit past VideoFrame's own edges (with
// matching negative margin to stay centered) so it visually spills past the
// video like light hitting the floor, instead of stopping flush with it.
const SpotBeam = styled.img`
  display: block;
  width: 109%;
  margin: 0 -4.5%;
  height: auto;
  opacity: 0.8;
`;

const Silhouette = styled.img`
  position: relative;
  z-index: 2;
  display: block;
  margin: -12rem auto 0;
  height: 24rem;
  width: auto;

  @media (max-width: 640px) {
    margin-top: -5rem;
    height: 10rem;
  }
`;

const PartLabel = styled.p`
  margin: 0;
  font-size: 1.6rem;
  font-family: 'SheLeeOkSun';
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-tertiary);
  margin-top: 2rem;

  @media (max-width: 640px) {
    font-size: 1.1rem;
    margin-top: 0.5rem;
  }
`;

const Title = styled.h2`
  margin: 0;
  font-family: 'SheLeeOkSun';
  font-size: 3.6rem;
  font-weight: 400;
  color: var(--cta-interactive);
  text-align: center;
  word-break: keep-all;

  @media (max-width: 640px) {
    font-size: 1.8rem;
  }
`;

const Description = styled.p`
  margin: 0;
  font-size: 1rem;
  line-height: 1.7;
  color: var(--text-tertiary);
  text-align: center;
  white-space: pre-line;
  text-shadow: 0 0 30px rgba(255, 254, 240, 0.50);
  margin-top: 2rem;

  @media (max-width: 640px) {
    font-size: 0.85rem;
    margin-top: 1.25rem;
    word-break: keep-all;
  }
`;

const CreditsWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3rem;
  margin-top: 5rem;

  @media (max-width: 640px) {
    gap: 1.75rem;
    margin-top: 2.5rem;
  }
`;

const CreditGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
`;

const CreditLabel = styled.p`
  margin: 0;
  font-family: 'SheLeeOkSun';
  font-size: 1.25rem;
  font-weight: 400;
  color: var(--text-secondary);

  @media (max-width: 640px) {
    font-size: 1rem;
  }
`;

const CreditName = styled.p`
  margin: 0;
  font-family: 'SheLeeOkSun';
  font-size: 1.25rem;
  font-weight: 400;
  color: var(--text-tertiary);
  line-height: 1.7;

  @media (max-width: 640px) {
    font-size: 1rem;
  }
`;

function Interviews() {
  const [partIndex, setPartIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);
  const isFirst = partIndex === 0;
  const isLast = partIndex === PARTS.length - 1;
  const part = PARTS[partIndex];

  // Switching parts should always land back on a paused, ready-to-play video
  // rather than silently continuing the previous part's playback state.
  useEffect(() => {
    videoRef.current?.pause();
    setIsPlaying(false);
    setProgress(0);
  }, [partIndex]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (event) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const bar = event.currentTarget;
    const ratio = (event.clientX - bar.getBoundingClientRect().left) / bar.clientWidth;
    video.currentTime = ratio * video.duration;
  };

  return (
    <PageBg>
      <Header />
      <Stage>
        <StageRow>
          {!isFirst && (
            <PrevButton aria-label="이전 인터뷰" onClick={() => setPartIndex((i) => i - 1)}>
              <img src={pastIcon} alt="" width={44} height={44} />
            </PrevButton>
          )}

          <VideoWrap>
            <VideoFrame>
              <VideoEl
                ref={videoRef}
                key={part.video}
                src={part.video}
                poster={part.poster}
                playsInline
                onEnded={() => setIsPlaying(false)}
                onTimeUpdate={(e) => {
                  const v = e.currentTarget;
                  if (v.duration) setProgress((v.currentTime / v.duration) * 100);
                }}
              />
              {!isPlaying && (
                <PlayPauseButton aria-label="영상 재생" onClick={togglePlay}>
                  <img src={startIcon} alt="" width={56} height={56} />
                </PlayPauseButton>
              )}
              {isPlaying && (
                <HoverControls>
                  <PlayPauseButton aria-label="영상 정지" onClick={togglePlay}>
                    <img src={pauseIcon} alt="" width={56} height={56} />
                  </PlayPauseButton>
                  <SeekBar onClick={handleSeek}>
                    <SeekBarFill style={{ width: `${progress}%` }} />
                  </SeekBar>
                </HoverControls>
              )}
            </VideoFrame>
            <SpotBeam src={spotBeamArt} alt="" />
            <Silhouette src={girlInterview} alt="" />
          </VideoWrap>

          {!isLast && (
            <NextButton aria-label="다음 인터뷰" onClick={() => setPartIndex((i) => i + 1)}>
              <img src={nextIcon} alt="" width={44} height={44} />
            </NextButton>
          )}
        </StageRow>

        <PartLabel>{part.label}</PartLabel>
        <Title>{part.title}</Title>
        <Description>{part.description}</Description>

        <CreditsWrap>
          <CreditGroup>
            <CreditLabel>{part.credits.crew.role}</CreditLabel>
            <CreditName>{part.credits.crew.name}</CreditName>
          </CreditGroup>

          <CreditGroup>
            <CreditLabel>인터뷰이</CreditLabel>
            {part.credits.interviewees.map((p) => (
              <CreditName key={p.name}>
                {p.name}·{p.age}·{p.job}
              </CreditName>
            ))}
          </CreditGroup>
        </CreditsWrap>
      </Stage>
    </PageBg>
  );
}

export default Interviews;
