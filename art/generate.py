"""Original Weight of Light miniature asset kit. Blender 4.3+, no external inputs.
Run: blender --background --factory-startup --python-exit-code 1 --python art/generate.py
"""
import bpy, math, random, json, struct
from mathutils import Vector
from pathlib import Path
random.seed(18)
ROOT = Path(__file__).resolve().parent.parent
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
for data in list(bpy.data.materials): bpy.data.materials.remove(data)

# Pigments, not photo textures: readable at the miniature's working scale.
def mat(name, color, rough=.7, metallic=0, emission=0):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Roughness'].default_value=rough; p.inputs['Metallic'].default_value=metallic
    if emission: p.inputs['Emission Color'].default_value=(*color,1); p.inputs['Emission Strength'].default_value=emission
    return m
M={
 'plaster':mat('chalk · warm lime plaster',(.71,.64,.46)),
 'cream':mat('ivory painted wood',(.90,.79,.57)),
 'blue':mat('midnight indigo wood',(.055,.115,.15)),
 'slate':mat('blue slate tiles',(.075,.17,.22)),
 'slate2':mat('weathered blue slate',(.12,.23,.27)),
 'wood':mat('old honey timber',(.34,.22,.115)),
 'wood2':mat('fresh timber edges',(.49,.34,.18)),
 'dark':mat('recess and iron',(.026,.043,.048)),
 'brass':mat('brushed brass',(.57,.38,.13),.35,.72),
 'patina':mat('verdigris brass',(.13,.34,.31),.6,.3),
 'red':mat('faded vermilion cloth',(.56,.15,.105)),
 'rope':mat('natural flax rope',(.52,.43,.27)),
 'glow':mat('amber light behind milk glass',(1,.60,.16),.4,0,1.8),
 'glass':mat('unlit milk glass',(.68,.75,.66),.28),
 'skin':mat('Noya · porcelain skin',(.83,.60,.37)),
 'hair':mat('Noya · ink hair',(.035,.036,.042)),
 'paper':mat('undelivered letter',(.88,.78,.56)),
 'plant':mat('dried sage leaves',(.16,.29,.22)),
}
roots=[]
def empty(name, parent=None, loc=(0,0,0)):
    o=bpy.data.objects.new(name,None); bpy.context.collection.objects.link(o); o.location=loc
    if parent:o.parent=parent
    return o
def root(name):
    o=empty(name); roots.append(o); return o
def finish(o,name,material,parent=None,bevel=0):
    o.name=name
    if material:o.data.materials.append(M[material])
    if parent:o.parent=parent
    if bevel:
        mod=o.modifiers.new('hand softened edges','BEVEL'); mod.width=bevel;mod.segments=1
        bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
    return o
def box(name,loc,size,material,parent,bevel=.025):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object
    o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,name,material,parent,bevel)
def cyl(name,loc,radius,depth,material,parent,vertices=12,rotation=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=loc)
    o=finish(bpy.context.object,name,material,parent,.008)
    if rotation:o.rotation_euler=rotation
    return o
def cone(name,loc,r1,r2,depth,material,parent,vertices=12):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices,radius1=r1,radius2=r2,depth=depth,location=loc)
    return finish(bpy.context.object,name,material,parent,.01)
def sphere(name,loc,scale,material,parent):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,radius=1,location=loc)
    o=bpy.context.object; o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    finish(o,name,material,parent)
    for p in o.data.polygons:p.use_smooth=True
    return o
def mesh(name,verts,faces,material,parent):
    d=bpy.data.meshes.new(name);d.from_pydata(verts,[],faces);d.update();o=bpy.data.objects.new(name,d)
    bpy.context.collection.objects.link(o);finish(o,name,material,parent);return o
def beam(name,start,end,radius,material,parent,vertices=8):
    a,b=Vector(start),Vector(end);o=cyl(name,(a+b)/2,radius,(b-a).length,material,parent,vertices)
    o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();return o
def torus(name,loc,major,minor,material,parent,rotation=(0,0,0)):
    bpy.ops.mesh.primitive_torus_add(major_segments=16,minor_segments=6,major_radius=major,minor_radius=minor,location=loc,rotation=rotation)
    return finish(bpy.context.object,name,material,parent)
def window(parent,x,y,z,w=.34,h=.47,lit=True):
    box('recess', (x,y,z),(w+.11,.065,h+.12),'dark',parent,.012)
    box('warm window' if lit else 'dark window',(x,y-.041,z),(w,.025,h),'glow' if lit else 'blue',parent,.006)
    for dx in [-w/2-.025,w/2+.025]:box('window upright',(x+dx,y-.065,z),(.047,.05,h+.14),'cream',parent,.008)
    for dz in [-h/2-.035,h/2+.035]:box('window sill',(x,y-.065,z+dz),(w+.15,.09,.055),'cream',parent,.008)
    box('window mullion',(x,y-.069,z),(.027,.06,h),'wood',parent,.004)
    box('window crossbar',(x,y-.07,z+.07),(w,.06,.024),'wood',parent,.004)
    # Shutters are irregular narrow painted planks.
    for side in [-1,1]:
        shutter=box('slatted shutter',(x+side*(w*.75+.1),y-.02,z),(.14,.05,h+.08),'red' if lit else 'patina',parent,.012)
        shutter.rotation_euler.z=side*.16
        for dz in [-.13,0,.13]:box('shutter brace',(x+side*(w*.75+.1),y-.052,z+dz),(.13,.02,.024),'wood2',parent,.003)

def roof(parent,w,d,eave,peak):
    verts=[(-w/2,-d/2,eave),(w/2,-d/2,eave),(0,-d/2,peak),(-w/2,d/2,eave),(w/2,d/2,eave),(0,d/2,peak)]
    mesh('gable plaster',verts,[(0,1,2),(3,5,4)],'cream',parent)
    # Six rows of individually staggered tiles, with tiny variations in slate pigment.
    for side in [-1,1]:
        a=Vector((0,0,peak));b=Vector((side*(w/2+.09),0,eave-.05));direction=b-a
        angle=math.atan2(-direction.z,abs(direction.x))
        for row in range(5):
            t=(row+.55)/5;x=side*(w/2+.09)*t;z=peak+(eave-.05-peak)*t
            for col in range(6):
                yy=-d/2-.06+(col+.5)*(d+.12)/6
                tile=box('cut slate tile',(x,yy,z),((w/2+.12)/5/math.cos(angle)+.03,(d+.12)/6-.012,.045),'slate' if (row+col)%3 else 'slate2',parent,.008)
                tile.rotation_euler.y=side*angle
    beam('brass ridge cap',(0,-d/2-.1,peak+.035),(0,d/2+.1,peak+.035),.045,'brass',parent)
    for side in [-1,1]:beam('carved verge',(0,-d/2-.085,peak+.012),(side*(w/2+.12),-d/2-.085,eave-.07),.035,'wood2',parent)

def house(name,w,d,h,variation):
    p=root(name)
    box('stone footing',(0,0,.065),(w+.12,d+.13,.13),'blue',p,.035)
    box('plaster wall',(0,0,h/2+.12),(w,d,h),'plaster' if variation!=1 else 'cream',p,.035)
    for side in [-1,1]:box('aged timber corner',(side*(w/2-.035),-d/2-.014,h/2+.1),(.07,.075,h),'wood',p,.012)
    box('horizontal timber',(0,-d/2-.025,.16),(w+.04,.07,.075),'wood',p,.012)
    # Front door and hand-set stone step.
    dx=-w*.25
    box('door recess',(dx,-d/2-.03,.47),(.34,.05,.73),'dark',p,.025)
    for k in range(4):box('door boards',(dx-.12+k*.08,-d/2-.063,.47),(.075,.025,.67),'blue',p,.005)
    cyl('brass door knob',(dx+.1,-d/2-.099,.46),.024,.03,'brass',p,8,(math.pi/2,0,0))
    box('doorstone',(dx,-d/2-.18,.095),(.5,.32,.12),'cream',p,.03)
    window(p,w*.23,-d/2-.028,h*.55+.17,.30,.43,variation!=2)
    if h>1.55:window(p,-w*.22,-d/2-.028,h-.28,.28,.32,True)
    # Sash window on the side: rotate an independent detail cluster.
    side=empty('side window group',p,(w/2+.02,0,.0));window(side,0,0,h*.6,.32,.42,variation==2);side.rotation_euler.z=math.pi/2
    roof(p,w+.09,d+.1,h+.12,h+.57)
    box('chimney',(w*.27,d*.25,h+.46),(.22,.23,.6),'plaster',p,.025)
    box('chimney rim',(w*.27,d*.25,h+.78),(.29,.3,.065),'cream',p,.013)
    box('chimney dark opening',(w*.27,d*.25,h+.817),(.15,.16,.009),'dark',p,.001)
    # Climbing wire and bricks repair the immaculate procedural surface.
    for k in range(3):box('exposed old brick',(w*.34-k*.08,-d/2-.014,.25+k*.09),(.15,.019,.06),'wood2',p,.012)
    if variation==0:
        box('window flowerbox',(w*.23,-d/2-.16,h*.55-.14),(.5,.24,.12),'wood',p,.018)
        for k in range(5):sphere('sage leaves',(w*.23-.18+k*.09,-d/2-.16,h*.55-.04),(.07,.07,.075),'plant',p)
    if variation==1:
        for k in range(4):box('child height mark',(-w*.43,-d/2-.06,.42+k*.075),(.08 if k%2 else .12,.012,.012),'red',p,.002)
    if variation==2:
        box('folded household cloth',(w*.23,-d/2-.15,h*.55-.08),(.32,.21,.035),'red',p,.008)
    return p
house('house_a',1.55,1.15,1.44,0)
house('house_b',1.3,1.1,1.8,1)
house('house_c',1.72,1.25,1.22,2)

p=root('platform')
for i in range(11):
    x=-1.5+(i+.5)*3/11
    box('individual platform board',(x,0,-.065),(3/11-.015,2,.13),'wood2' if i%3==0 else 'wood',p,.014)
    for y in [-.78,.78]:cyl('square headed peg',(x,y,.006),.019,.015,'brass',p,6)
for y in [-.72,.72]:box('underslung bearer',(0,y,-.17),(3.13,.14,.15),'blue',p,.02)
for x in [-1.4,1.4]:
    for y in [-.85,.85]:
        box('brass suspension shoe',(x,y,-.02),(.15,.15,.15),'brass',p,.02)
        torus('rope eye',(x,y,.105),.075,.017,'brass',p,(math.pi/2,0,0))
for x in [-1.45,1.45]:
    for y in [-.8,.8]:cyl('balustrade post',(x,y,.29),.035,.6,'blue',p)
    beam('end handrail',(x,-.83,.58),(x,.83,.58),.033,'wood2',p)

p=root('bridge')
for i in range(13):box('bridge board',(-1.25+(i+.5)*2.5/13,0,0),(2.5/13-.015,.73,.09),'wood2' if i%4==0 else 'wood',p,.009)
for y in [-.32,.32]:
    beam('underside rope',(-1.3,y,-.06),(1.3,y,-.06),.025,'rope',p)
    for x in [-1.18,1.18]:cyl('bridge post',(x,y,.3),.026,.61,'wood',p)
    for i in range(10):
        x=-1.18+i*2.36/10;xx=-1.18+(i+1)*2.36/10
        z=.6-.1*math.sin(math.pi*i/10);zz=.6-.1*math.sin(math.pi*(i+1)/10)
        beam('slack rope handrail',(x,y,z),(xx,y,zz),.015,'rope',p,6)

p=root('vial')
cyl('vial foot',(0,0,.045),.22,.09,'brass',p)
cyl('blue ceramic collar',(0,0,.12),.175,.08,'blue',p)
sphere('milkglass reservoir',(0,0,.36),(.16,.16,.24),'glass',p)
cyl('top brass ring',(0,0,.57),.145,.05,'brass',p)
cone('vial cap',(0,0,.63),.15,.055,.09,'brass',p)
torus('lifting loop',(0,0,.72),.061,.013,'brass',p,(math.pi/2,0,0))
for a in [0,math.pi/2,math.pi,3*math.pi/2]:beam('vial brass rib',(.17*math.cos(a),.17*math.sin(a),.15),(.14*math.cos(a),.14*math.sin(a),.57),.012,'brass',p)
# Visible marks distinguish a suspended weight reservoir from domestic lamps.
for z in [.27,.36,.45]:box('charge scale mark',(0,-.165,z),(.085,.018,.012),'brass',p,.003)

p=root('lamp')
box('fixed lamp plinth',(0,0,.04),(.36,.32,.08),'blue',p,.03)
beam('lamp pedestal',(0,0,.08),(0,0,.35),.045,'brass',p)
cone('lamp milk shade',(0,0,.47),.23,.11,.25,'glass',p)
cyl('shade brass rim',(0,0,.343),.23,.025,'brass',p)
sphere('lamp luminous core',(0,0,.41),(.09,.09,.1),'glow',p)
box('isolation tile',(0,-.145,.075),(.23,.08,.025),'cream',p,.008)

p=root('lighthouse')
cyl('octagonal stone base',(0,0,.16),.86,.32,'blue',p,8)
cone('ivory tapering tower',(0,0,1.84),.63,.39,3.25,'plaster',p,12)
for z,r in [(.42,.64),(1.0,.60),(2.0,.52),(3.2,.43)]:cyl('tower masonry course',(0,0,z),r,.055,'cream',p,12)
for z in [1.25,2.25,2.92]:
    box('lighthouse slit',(0,-(.62-.074*z),z),(.14,.045,.36),'dark',p,.035)
    box('lighthouse slit glass',(0,-(.65-.074*z),z),(.075,.015,.27),'glow',p,.015)
box('keeper door',(0,-.62,.43),(.32,.06,.57),'blue',p,.05)
cyl('gallery plate',(0,0,3.42),.76,.11,'brass',p,16)
for i in range(16):
    a=i*math.tau/16
    beam('gallery rail post',(.69*math.cos(a),.69*math.sin(a),3.46),(.69*math.cos(a),.69*math.sin(a),3.78),.015,'blue',p,6)
torus('gallery upper rail',(0,0,3.78),.69,.024,'brass',p)
cyl('lantern glass',(0,0,3.89),.38,.77,'glass',p,12)
for i in range(8):
    a=i*math.tau/8
    beam('lantern frame',(.4*math.cos(a),.4*math.sin(a),3.52),(.4*math.cos(a),.4*math.sin(a),4.28),.025,'brass',p)
cone('lighthouse roof',(0,0,4.45),.61,.025,.36,'blue',p,12)
cyl('roof finial',(0,0,4.71),.025,.23,'brass',p)
beam('weather vane',(-.23,0,4.79),(.23,0,4.79),.014,'brass',p)
mesh('vane arrow',[(.23,0,4.79),(.12,0,4.88),(.12,0,4.70)],[(0,1,2)],'brass',p)

p=root('bench')
for y in [-.15,0,.15]:box('bench seat plank',(0,y,.35),(1.05,.13,.065),'wood2',p,.014)
for x in [-.38,.38]:
    for y in [-.14,.14]:box('bench leg',(x,y,.17),(.07,.07,.34),'blue',p,.012)
    box('bench back post',(x,.19,.55),(.06,.06,.5),'blue',p,.012)
for z in [.53,.7]:box('bench back slat',(0,.2,z),(1.04,.07,.12),'wood',p,.012)
# An empty cup and an unfinished wooden toy.
cyl('cup on bench',(.28,-.02,.43),.045,.09,'cream',p,10)
torus('cup handle',(.33,-.02,.43),.026,.009,'cream',p,(math.pi/2,0,0))

p=root('awning')
for x in [-.65,.65]:beam('awning bracket',(x,.1,1.45),(x,-.65,1.24),.025,'brass',p)
for i in range(7):
    x=-.7+i*.2
    mesh('cloth stripe',[(x,.15,1.53),(x+.2,.15,1.53),(x+.2,-.72,1.28),(x,-.72,1.28),(x+.2,-.74,1.15),(x,-.74,1.15)],[(0,1,2,3),(3,2,4,5)],'red' if i%2==0 else 'cream',p)

p=root('toy')
box('wooden toy boat hull',(0,0,.055),(.26,.12,.1),'red',p,.04)
beam('toy mast',(0,0,.1),(0,0,.37),.009,'wood2',p,6)
mesh('toy folded sail',[(0,0,.35),(0,0,.14),(.15,0,.14)],[(0,1,2)],'paper',p)

p=root('noya')
hips=empty('noya_hips',p,(0,0,.43))
# Animated pivots keep the model inexpensive and cloneable without a skeleton.
body=empty('noya_body',hips)
cone('Noya blue dress',(0,0,.12),.15,.11,.31,'blue',body,10)
# Cape custom asymmetric hem and folded front seam.
verts=[]
for ring,(z,r) in enumerate([(.31,.12),(.22,.17),(.055,.23)]):
    for i in range(10):
        a=math.tau*i/10
        verts.append((r*math.cos(a),r*math.sin(a)+.04,z+(.015*math.sin(i*2.8) if ring==2 else 0)))
faces=[]
for row in range(2):
    for i in range(10):faces.append((row*10+i,row*10+(i+1)%10,(row+1)*10+(i+1)%10,(row+1)*10+i))
mesh('Noya tailored red cape',verts,faces,'red',body)
sphere('Noya brass clasp',(0,-.115,.27),(.027,.017,.027),'brass',body)
head=empty('noya_head',body,(0,0,.43))
sphere('Noya face',(0,-.012,0),(.128,.115,.15),'skin',head)
sphere('Noya bob haircut',(0,.028,.035),(.139,.115,.135),'hair',head)
# Forehead hair swept across, profile nose and eyes.
sphere('Noya fringe',(-.035,-.078,.094),(.11,.048,.058),'hair',head)
sphere('Noya nose',(0,-.131,-.005),(.022,.026,.025),'skin',head)
for x in [-.045,.045]:sphere('Noya eye',(x,-.119,.022),(.009,.006,.012),'hair',head)
for x in [-.092,.092]:sphere('Noya rosy cheek',(x,-.085,-.025),(.021,.01,.013),'red',head)
legs=[];arms=[]
for side,x in [('left',-.073),('right',.073)]:
    leg=empty('noya_'+side+'_leg',hips,(x,0,-.025));legs.append(leg)
    cyl('Noya stocking',(0,0,-.16),.042,.27,'blue',leg,10)
    box('Noya leather boot',(0,-.031,-.335),(.1,.17,.13),'wood',leg,.028)
    arm=empty('noya_'+side+'_arm',body,(x*1.7,0,.25));arms.append(arm)
    cyl('Noya sleeve',(0,0,-.087),.042,.17,'red',arm,10)
    sphere('Noya hand',(0,-.005,-.19),(.039,.034,.048),'skin',arm)
# Courier case insulated from balances: cream lining, wooden outer skin, brass seam.
case=empty('noya_case',hips,(.2,-.03,-.01))
box('Noya wooden courier case',(0,0,0),(.15,.16,.22),'wood2',case,.022)
box('Noya ivory insulated lining',(0,-.086,0),(.11,.018,.17),'cream',case,.012)
box('Noya case brass latch',(0,-.101,.04),(.04,.014,.035),'brass',case,.006)
beam('Noya diagonal strap',(-.11,-.14,.71),(.21,-.15,.46),.015,'wood',p,6)

# Independent per-object NLA tracks sharing names are merged into five glTF clips.
animated=[hips,body,head,*legs,*arms]
base={o.name:(o.location.copy(),o.rotation_euler.copy()) for o in animated}
for clip,length in [('idle',72),('walk',24),('take',32),('give',32),('discovery',60)]:
    for o in animated:
        o.animation_data_clear();o.location=base[o.name][0];o.rotation_euler=base[o.name][1]
        for f in [0,length//4,length//2,length*3//4,length]:
            t=f/length;wave=math.sin(t*math.tau)
            o.location=base[o.name][0];o.rotation_euler=base[o.name][1]
            if o==hips:o.location.z+= (.014*math.sin(t*math.tau*2) if clip=='walk' else .006*wave)
            if clip=='walk':
                if o in legs:o.rotation_euler.x=wave*.48*(1 if o==legs[0] else -1)
                if o in arms:o.rotation_euler.x=wave*.24*(-1 if o==arms[0] else 1)
            if clip in ['take','give']:
                reach=math.sin(t*math.pi)
                if o==arms[1]:o.rotation_euler.x=(-1 if clip=='take' else -1.1)*reach
                if o==body:o.rotation_euler.x=.12*reach
                if o==head:o.rotation_euler.x=.18*reach
            if clip=='discovery':
                if o==head:o.rotation_euler.x=-.22*math.sin(t*math.pi)
                if o in arms:o.rotation_euler.y=.12*math.sin(t*math.pi)*(1 if o==arms[0] else -1)
            if clip=='idle' and o==head:o.rotation_euler.z=.055*wave
            o.keyframe_insert(data_path='location',frame=f);o.keyframe_insert(data_path='rotation_euler',frame=f)
        action=o.animation_data.action;action.name=clip+'_'+o.name
        # Store separately, then rebuild all tracks once actions are made.
        action.use_fake_user=True
# animation_data_clear removes tracks, not fake-user actions.
for o in animated:
    o.animation_data_clear();o.animation_data_create()
    for clip,length in [('idle',72),('walk',24),('take',32),('give',32),('discovery',60)]:
        action=bpy.data.actions.get(clip+'_'+o.name)
        track=o.animation_data.nla_tracks.new();track.name=clip
        strip=track.strips.new(clip,0,action);strip.action_frame_start=0;strip.action_frame_end=length
        track.mute=True
    o.location=base[o.name][0];o.rotation_euler=base[o.name][1]
bpy.context.scene.frame_set(0)
bpy.context.scene.render.fps=24

# Join each static template by pigment for economical renderer draw calls.
# Noya retains its articulated hierarchy and animation targets.
for asset in roots:
    if asset.name == 'noya': continue
    descendants=[o for o in asset.children_recursive if o.type=='MESH']
    groups={}
    for o in descendants:
        key=o.data.materials[0].name if o.data.materials else 'none'
        groups.setdefault(key,[]).append(o)
    for pigment,objects in groups.items():
        bpy.ops.object.select_all(action='DESELECT')
        for o in objects:o.select_set(True)
        bpy.context.view_layer.objects.active=objects[0]
        bpy.ops.object.join()
        merged=bpy.context.object
        world=merged.matrix_world.copy();merged.parent=asset;merged.matrix_world=world
        merged.name=asset.name+' · '+pigment
    # Empty detail groups were only needed during construction.
    for o in list(bpy.data.objects):
        if o.type=='EMPTY' and o!=asset and o in asset.children_recursive and not o.children:
            bpy.data.objects.remove(o,do_unlink=True)

# Source scene is laid out as an editable asset tray; export resets root transforms.
for i,r in enumerate(roots):r.location=(i%5*4, i//5*5,0)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'art/weight-of-light.blend'))
for r in roots:r.location=(0,0,0)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/models/town.glb'),export_format='GLB',export_apply=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_nla_strips=True,export_materials='EXPORT',export_texcoords=False,export_cameras=False,export_lights=False)
# Assert the public interface of the binary we actually wrote.
data=(ROOT/'public/models/town.glb').read_bytes();size,kind=struct.unpack_from('<II',data,12)
gltf=json.loads(data[20:20+size]);names={gltf['nodes'][n]['name'] for n in gltf['scenes'][0]['nodes']}
expected={'house_a','house_b','house_c','platform','bridge','vial','lamp','lighthouse','noya','bench','awning','toy'}
assert expected<=names,(expected-names)
clips={a['name'] for a in gltf.get('animations',[])}
assert {'idle','walk','take','give','discovery'}<=clips,clips
assert len(data)<2_000_000,len(data)
print('ASSET_EXPORT_PASS',len(data),'bytes',len(gltf.get('meshes',[])),'meshes','clips',sorted(clips),'roots',sorted(names))
