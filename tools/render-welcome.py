"""Render a small narrated motion-graphics welcome from supplied branding and actual hub captures.
Narration AIFFs/timing are generated with the installed macOS synthetic voice into /private/tmp/curios-welcome-work.
"""
from pathlib import Path
import json,subprocess,re,math
from PIL import Image,ImageDraw,ImageFont,ImageOps
ROOT=Path(__file__).resolve().parents[1]
WORK=Path('/private/tmp/curios-welcome-work')
PARTS=json.loads((WORK/'timeline.json').read_text())
ASSETS=ROOT/'playable-3d/assets/curios'
FONT='/System/Library/Fonts/Supplemental/Arial Bold.ttf'
FONT_REG='/System/Library/Fonts/Supplemental/Arial.ttf'
images=[ASSETS/'curios-branding.png',ROOT/'docs/evidence/curios-campus-clean.jpg',ROOT/'docs/evidence/curios-app-map.jpg',ROOT/'docs/evidence/teacher-settings-film.jpg',ASSETS/'curios-branding.png']
for i,part in enumerate(PARTS):
 duration=part['duration'];frames=math.ceil(duration*30)
 title=WORK/f'title-{i}.txt';caption=WORK/f'caption-{i}.txt';title.write_text(part['title']);caption.write_text(part['caption'])
 # Original artwork pixels are only composed into this video; source image files remain unchanged.
 vf=f"scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,zoompan=z='min(zoom+0.00007,1.065)':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s=1280x720:fps=30"
 if i in [1,2,3]:vf+=",drawbox=x=0:y=0:w=iw:h=ih:color=0x031d29@0.12:t=fill"
 frame=ImageOps.fit(Image.open(images[i]).convert('RGB'),(1280,720))
 overlay=Image.new('RGBA',frame.size);draw=ImageDraw.Draw(overlay)
 draw.rectangle((42,538,1238,678),fill=(6,35,46,235));draw.rectangle((42,538,50,678),fill=(0,222,214,255))
 draw.text((72,548),part['title'],font=ImageFont.truetype(FONT,53),fill='white')
 draw.text((74,615),part['caption'],font=ImageFont.truetype(FONT_REG,34),fill=(255,214,109))
 frame=Image.alpha_composite(frame.convert('RGBA'),overlay).convert('RGB');composed=WORK/f'frame-{i}.jpg';frame.save(composed,quality=95)
 vf+=f",fade=t=in:st=0:d=0.22,fade=t=out:st={duration-.28:.3f}:d=0.28,format=yuv420p"
 output=WORK/f'part-{i}.mp4'
 command=['ffmpeg','-y','-hide_banner','-loglevel','error','-loop','1','-framerate','30','-i',str(composed),'-i',str(WORK/f'voice-{i}.aiff'),'-vf',vf,'-af',f'loudnorm=I=-16:TP=-1.5:LRA=7,apad=pad_dur=0.5,atrim=duration={duration}', '-t',str(duration),'-c:v','libx264','-preset','fast','-crf','23','-profile:v','main','-level','3.1','-pix_fmt','yuv420p','-r','30','-c:a','aac','-b:a','128k','-ar','48000','-ac','2','-threads','2',str(output)]
 subprocess.run(command,check=True);print('Rendered',i,round(duration,1),'seconds',flush=True)
(WORK/'concat.txt').write_text(''.join(f"file '{WORK/f'part-{i}.mp4'}'\n" for i in range(len(PARTS))))
final=ASSETS/'basil-welcome.mp4'
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-f','concat','-safe','0','-i',str(WORK/'concat.txt'),'-c','copy','-movflags','+faststart',str(final)],check=True)
# Accessible word-for-word captions in short cues; the default picture uses short visual headings.
def stamp(seconds):
 ms=round(seconds*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02}.{ms%1000:03}'
start=0;vtt=['WEBVTT',''];transcript=[]
for part in PARTS:
 words=part['text'].split();total=len(words);cursor=0
 for offset in range(0,total,9):
  cue=words[offset:offset+9];begin=start+part['speechDuration']*offset/total;end=start+part['speechDuration']*min(offset+9,total)/total
  vtt += [f'{stamp(begin)} --> {stamp(end)}',' '.join(cue),'']
 part['start']=start;start+=part['duration'];transcript.append(part['text'])
(ASSETS/'basil-welcome.vtt').write_text('\n'.join(vtt)+'\n')
(ASSETS/'basil-welcome-transcript.txt').write_text('\n\n'.join(transcript)+'\n')
(ASSETS/'basil-welcome-timeline.json').write_text(json.dumps({'duration':start,'voice':'Installed macOS Daniel (English UK), synthetic narration; not a recording of Basil','parts':PARTS},indent=2,ensure_ascii=False)+'\n')
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-ss','1.5','-i',str(final),'-frames:v','1','-q:v','3',str(ASSETS/'basil-welcome-poster.jpg')],check=True)
print('Welcome film ready:',round(start,1),'seconds,',round(final.stat().st_size/1024/1024,2),'MiB',flush=True)
