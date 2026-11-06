// Unknown, turn, run and jump clips must never become the idle action.
export function selectAvatarClips(animations = []) {
 const match = name => animations.find(clip=>typeof clip?.name==='string' && name.test(clip.name));
 return {idle:match(/^standing_relax$/i)||match(/(?:^|[ :_.-])(idle|standing|stand|relax)(?:[ :_.-]|$)/i),walk:match(/^walk$/i)||match(/(?:^|[ :_.-])walk(?:[ :_.-]|$)/i)};
}
