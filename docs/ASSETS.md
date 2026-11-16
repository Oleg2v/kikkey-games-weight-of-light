# Weight of Light — original miniature kit

All geometry and material definitions in this kit were created specifically for this project by `art/generate.py`. No stock models, downloaded textures, photographs, third-party character designs, or externally hosted artwork are used. The source consists of ordinary editable meshes, material nodes, object pivots, and keyframed animations. Blender is the authoring tool; its GPL license does not impose GPL on exported artwork. Project-created artwork follows the repository's chosen project license.

## Files and reproduction

- `art/generate.py`: deterministic Blender Python source, including pigments, model construction, articulation, animation, source-scene layout, and export validation.
- `art/asset-preview.png`: offline Blender render of the actual exported GLB, showing a representative group of assets (not a gameplay screenshot).
- `art/weight-of-light.blend`: editable asset tray; templates are laid out in rows for inspection. Editing the Python generator and regenerating will replace this file, so preserve any manual edits first.
- `public/models/town.glb`: browser bundle, 1,759,744 bytes at initial export. It contains 12 independent templates, 18 materials, 92 mesh objects and 32,404 triangles across the entire kit. No UVs/textures are exported because all visual materials are defined locally.

Run from the repository root with Blender 4.3.2 or compatible newer Blender:

```sh
XDG_CONFIG_HOME=/tmp/weight-of-light-art/config \
XDG_CACHE_HOME=/tmp/weight-of-light-art/cache \
blender --background --factory-startup --python-exit-code 1 --python art/generate.py
```

The generator validates the actual exported GLB roots, all five animation names, and a binary size ceiling of 2 MB. It preserves standard TLS/signature settings because no downloads occur.

## Runtime contract

GLTFLoader receives root groups with the exact names below. Exported template origins are centered at their feet or base, at `(0,0,0)`; the source tray's display offsets are removed only for export. glTF uses `+Y` up and the front of the houses and character faces `+Z`. Clone the required root with `clone(true)` and share immutable geometry/materials. Place house/character roots at the deck surface, not at its center.

| Root         | Purpose and distinguishing detail                                                                | Approximate size, width × height × depth |
| ------------ | ------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| `house_a`    | Lime plaster, blue individual slate roof tiles, sage planter, open red shutters, brass door knob | 1.8 × 2.3 × 1.5                          |
| `house_b`    | Tall narrow house, second upper window, child's height marks beside the door                     | 1.6 × 2.7 × 1.5                          |
| `house_c`    | Low house, folded vermilion fabric, dark front window and illuminated side window                | 2.0 × 2.1 × 1.6                          |
| `platform`   | Eleven timber planks, brass pegs and four suspension eyes; wood side rails                       | 3.15 × 0.82 × 2.0                        |
| `bridge`     | Thirteen boards, visibly sagging flax handrails and four wooden posts                            | 2.6 × 0.7 × 0.75                         |
| `vial`       | Suspended brass reservoir, milk glass, three scale marks and a lifting ring                      | 0.44 × 0.8 × 0.44                        |
| `lamp`       | Fixed domestic shade, plinth, visible insulating tile; distinct from the weight vial             | 0.46 × 0.61 × 0.46                       |
| `lighthouse` | Tapered twelve-sided plaster shaft, lit narrow windows, gallery and brass-framed lantern         | 1.72 × 4.9 × 1.72                        |
| `noya`       | Ink bob haircut, asymmetrical short red cape, boots, brass clasp and insulated courier case      | 0.45 × 1.05 × 0.42                       |
| `bench`      | Slatted seat and back, small cup with a handle                                                   | 1.05 × 0.8 × 0.45                        |
| `awning`     | Striped red/ivory cloth, hanging valance and brass supporting arms                               | 1.4 × 1.53 × 0.9                         |
| `toy`        | Small red wooden boat and folded paper sail                                                      | 0.26 × 0.37 × 0.12                       |

Heights include details such as chimney/vane. The platform's deck surface is at local `Y≈0`; the bearers extend below it and end rails above it. Avoid overlapping decorative end rails with interaction paths; the game may hide or scale them if needed.

Static templates are joined by pigment to reduce draw calls: houses use 12–13 mesh objects each, platform 4, bridge 3, lighthouse 7. Materials have meaningful names and can be cloned per instance when changing window illumination. Do not mutate shared materials to change a single house.

## Noya motion

The hierarchy is rigidly articulated, so it does not require a skinned-mesh cloning utility. It retains pivots `noya_hips`, `noya_body`, `noya_head`, `noya_left_leg`, `noya_right_leg`, `noya_left_arm`, `noya_right_arm`. An `AnimationMixer` rooted at a cloned `noya` group can play the GLB clips:

- `idle`: gentle breathing and a small head movement, 3 seconds.
- `walk`: opposing leg and arm motion, 1 second.
- `take`: right hand reaches for the reservoir, slight body lean, 1⅓ seconds.
- `give`: reaching gesture with a deeper extension, 1⅓ seconds.
- `discovery`: upward gaze and a slight opening of the arms, 2½ seconds.

The game should loop idle/walk and play interaction/discovery clips once with appropriate blending. Character translation is controlled by deterministic game movement, not baked into an animation. Reduced motion can keep poses while suppressing unnecessary idle movement.

## Appearance and limits

Hand-softened edges, individual roof tiles, asymmetrical cloth, layered timber, brass details and household props are geometry, not a bloom effect. The warm palette reads without bloom. Glass is intentionally opaque milk glass for crisp miniature silhouettes and predictable mobile rendering; glow strength can be adjusted by the renderer. Dynamic charge particles, rope tension, scene layout, world animation and lighting belong to the runtime renderer.

A software Blender render of the exported GLB validates importability and the modeled silhouettes. This does not establish mobile GPU performance. Draco compression is not used, so the game does not need a decoder download or the optional Blender Draco library.
