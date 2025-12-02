import React, { useState, useCallback } from "react";
import { Meta, StoryFn } from "@storybook/react";
import { Sheet } from "@fileverse-dev/fortune-core";
import { Workbook } from "@fortune-sheet/react";
import cell from "./data/cell";
import formula from "./data/formula";
import empty from "./data/empty";
import freeze from "./data/freeze";
import dataVerification from "./data/dataVerification";
import lockcellData from "./data/protected";

export default {
  component: Workbook,
} as Meta<typeof Workbook>;

const Template: StoryFn<typeof Workbook> = ({
  // eslint-disable-next-line react/prop-types
  data: data0,
  ...args
}) => {
  const [data, setData] = useState<Sheet[]>([
    {
        "name": "Sheet1",
        "config": {
            "rowlen": {
                "0": 47,
                "1": 47.2,
                "2": 22,
                "3": 22,
                "4": 22,
                "5": 555,
                "6": 22,
                "7": 506
            },
            "columnlen": {
                "0": 103,
                "1": 211,
                "2": 353,
                "3": 323,
                "4": 452,
                "5": 416,
                "6": 247,
                "7": 416
            },
            "customHeight": {
                "0": 1,
                "5": 1,
                "7": 1
            },
            "merge": {
                "0_0": {
                    "r": 0,
                    "c": 0,
                    "rs": 1,
                    "cs": 8
                }
            },
            "customWidth": {
                "0": 1,
                "1": 1,
                "2": 1,
                "3": 1,
                "4": 1,
                "5": 1,
                "6": 1
            }
        },
        "order": 0,
        "row": 500,
        "column": 36,
        "id": "31324864-50b3-4ae5-b51a-5a67fb5d52c4",
        "status": 1,
        "luckysheet_select_save": [
            {
                "left": 104,
                "width": 211,
                "top": 165,
                "height": 555,
                "left_move": 104,
                "width_move": 211,
                "top_move": 165,
                "height_move": 555,
                "row": [
                    5,
                    5
                ],
                "column": [
                    1,
                    1
                ],
                "row_focus": 5,
                "column_focus": 1
            }
        ],
        "luckysheet_selection_range": [
            {
                "row": [
                    0,
                    499
                ],
                "column": [
                    0,
                    35
                ]
            }
        ],
        "zoomRatio": 1,
        "celldata": [
            {
                "r": 0,
                "c": 0,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Node Operator Community Hub Schedule – Devconnect ARG, Buenos Aires",
                    "tb": "1",
                    "m": "Node Operator Community Hub Schedule – Devconnect ARG, Buenos Aires",
                    "fs": 18,
                    "bl": 1,
                    "mc": {
                        "r": 0,
                        "c": 0,
                        "rs": 1,
                        "cs": 8
                    }
                }
            },
            {
                "r": 0,
                "c": 1,
                "v": {
                    "mc": {
                        "r": 0,
                        "c": 0
                    }
                }
            },
            {
                "r": 0,
                "c": 2,
                "v": {
                    "mc": {
                        "r": 0,
                        "c": 0
                    }
                }
            },
            {
                "r": 0,
                "c": 3,
                "v": {
                    "mc": {
                        "r": 0,
                        "c": 0
                    }
                }
            },
            {
                "r": 0,
                "c": 4,
                "v": {
                    "mc": {
                        "r": 0,
                        "c": 0
                    }
                }
            },
            {
                "r": 0,
                "c": 5,
                "v": {
                    "mc": {
                        "r": 0,
                        "c": 0
                    }
                }
            },
            {
                "r": 0,
                "c": 6,
                "v": {
                    "mc": {
                        "r": 0,
                        "c": 0
                    }
                }
            },
            {
                "r": 0,
                "c": 7,
                "v": {
                    "mc": {
                        "r": 0,
                        "c": 0
                    }
                }
            },
            {
                "r": 2,
                "c": 0,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Date",
                    "tb": "1",
                    "m": "Date",
                    "bl": 1,
                    "bg": "#D9D3E8"
                }
            },
            {
                "r": 2,
                "c": 1,
                "v": {
                    "m": "Monday Nov 17",
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Monday Nov 17",
                    "bl": 1,
                    "bg": "#D9D3E8"
                }
            },
            {
                "r": 2,
                "c": 2,
                "v": {
                    "m": "Tuesday Nov 18",
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Tuesday Nov 18",
                    "bl": 1,
                    "bg": "#D9D3E8"
                }
            },
            {
                "r": 2,
                "c": 3,
                "v": {
                    "m": "Wednesday Nov 19",
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Wednesday Nov 19",
                    "bl": 1,
                    "bg": "#D9D3E8"
                }
            },
            {
                "r": 2,
                "c": 4,
                "v": {
                    "m": "Thursday Nov 20",
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Thursday Nov 20",
                    "bl": 1,
                    "bg": "#D9D3E8"
                }
            },
            {
                "r": 2,
                "c": 5,
                "v": {
                    "m": "Friday Nov 21",
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Friday Nov 21",
                    "bl": 1,
                    "bg": "#D9D3E8"
                }
            },
            {
                "r": 2,
                "c": 6,
                "v": {
                    "m": "Saturday Nov 22",
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Saturday Nov 22",
                    "bl": 1,
                    "bg": "#D9D3E8"
                }
            },
            {
                "r": 3,
                "c": 0,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Theme / Owner",
                    "tb": "1",
                    "m": "Theme / Owner",
                    "bl": 1,
                    "bg": "#FCE5CF"
                }
            },
            {
                "r": 3,
                "c": 1,
                "v": {
                    "m": "Intro, workshop",
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Intro, workshop",
                    "bl": 1,
                    "bg": "#FCE5CF"
                }
            },
            {
                "r": 3,
                "c": 2,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "SEED",
                    "tb": "1",
                    "m": "SEED",
                    "bl": 1,
                    "bg": "#FCE5CF"
                }
            },
            {
                "r": 3,
                "c": 3,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "SSV",
                    "tb": "1",
                    "m": "SSV",
                    "bl": 1,
                    "bg": "#FCE5CF"
                }
            },
            {
                "r": 3,
                "c": 4,
                "v": {
                    "m": "Sensei Node",
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Sensei Node",
                    "bl": 1,
                    "bg": "#FCE5CF"
                }
            },
            {
                "r": 3,
                "c": 5,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Open Contributions Day",
                    "tb": "1",
                    "m": "Open Contributions Day",
                    "bl": 1,
                    "bg": "#FCE5CF"
                }
            },
            {
                "r": 3,
                "c": 6,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Final / Recap day",
                    "tb": "1",
                    "m": "Final / Recap day",
                    "bl": 1,
                    "bg": "#FCE5CF"
                }
            },
            {
                "r": 4,
                "c": 0,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "tb": "1"
                }
            },
            {
                "r": 5,
                "c": 0,
                "v": {
                    "m": "Morning",
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Morning",
                    "bg": "#C9DBF7",
                    "bl": 1
                }
            },
            {
                "r": 5,
                "c": 1,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "ETH Day, share week schedule, workshop node support",
                    "tb": "2",
                    "m": "ETH Day, share week schedule, workshop node support"
                }
            },
            {
                "r": 5,
                "c": 2,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "inlineStr",
                        "s": [
                            {
                                "v": "09:00 – 09:45\r\nMini workshop: Node operator workshop with Lido CSM – Enti (Lido)\r\n\r\n\r\n10:00 – 10:45\r\nMini Workshop: Operating Validators in 2026: Metrics, Alerts and Resilient Setups — SEEDNodes (Mateo Emilio)\r\n\r\n\r\n11:00 – 12:30\r\nWorkshop/Talk (1 – 1.5 hrs): Introduction to nodes and validators for university students – Sr. Wilbur (SEEDNodes)\r\n\r\n\r\n12:30 – 13:15\r\nMini workshop: How to deploy an Obol DVT cluster using Hooid (hands-on technical) — Lorenzo"
                            }
                        ]
                    },
                    "tb": "2",
                    "fs": 10
                }
            },
            {
                "r": 5,
                "c": 3,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "inlineStr",
                        "s": [
                            {
                                "v": "9:00 AM: Gates open\r\nSetup check, always-on demo running.\r\n\r\n\r\n10:00 AM: Welcome & framing\r\nSpeaker: Alon (SSV Network)\r\nDuration: 20 min\r\nTone: Community-first. “Why we're here — the next stage for node ops and validators.”\r\n\r\n\r\n10:20 AM: Panel | The state of node operations & DVT\r\nDuration: 30 min\r\nGoal: Showcase how distributed validator tech (DVT) is redefining validator resilience, decentralization, and accessibility.\r\n\r\n\r\n11 AM: Lightning talks (3 × 7 min)\r\nShort, high-signal bursts from community projects.\r\nDuration: 25 min\r\nPossible lineup:\r\n– Running a DVT node — SSV community member; GBeans\r\n– MEV and DVT: What’s next for validator rewards — Compose engineer\r\n– Client diversity beyond buzzwords: SigmaPrime\r\n\r\n\r\n11:30 AM: Validators beyond the L1\r\nUnlocking the Next Frontier of a unified Ethereum\r\nDuration: 20 mins\r\n\r\n\r\n12 noon: Panel | Preconfirmations & shared sequencing IRL\r\nDuration: 30 min"
                            }
                        ]
                    },
                    "tb": "2",
                    "fs": 10
                }
            },
            {
                "r": 5,
                "c": 4,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "inlineStr",
                        "s": [
                            {
                                "v": "10:00 am Setting up your first validator Blockchain Engineer\r\n\r\n\r\n\r\n\r\n11:00 am Ask me Anything Blockchain Engineer\r\n\r\n\r\n\r\n\r\n12:00 pm Best Practices on DVT Blockchain Engineer\r\n\r\n\r\n"
                            }
                        ]
                    },
                    "tb": "2",
                    "fs": 10
                }
            },
            {
                "r": 5,
                "c": 5,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "10am How Validators Earn and Lose Rewards (Nico from Node Sentinel)",
                    "tb": "2",
                    "m": "10am How Validators Earn and Lose Rewards (Nico from Node Sentinel)"
                }
            },
            {
                "r": 5,
                "c": 6,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Workshop and revisit topics from the week that were written on whiteboard",
                    "tb": "2",
                    "m": "Workshop and revisit topics from the week that were written on whiteboard"
                }
            },
            {
                "r": 6,
                "c": 0,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Break",
                    "tb": "1",
                    "m": "Break",
                    "bg": "#FCE5CF",
                    "bl": 1
                }
            },
            {
                "r": 6,
                "c": 2,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "13:15 – 14:00 Break / Almuerzo",
                    "tb": "1",
                    "m": "13:15 – 14:00 Break / Almuerzo"
                }
            },
            {
                "r": 6,
                "c": 3,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "12:30 to 1:30: Open networking + pizza break",
                    "tb": "1",
                    "m": "12:30 to 1:30: Open networking + pizza break"
                }
            },
            {
                "r": 6,
                "c": 4,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Break / Almuerzo",
                    "tb": "1",
                    "m": "Break / Almuerzo"
                }
            },
            {
                "r": 6,
                "c": 5,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Break / Almuerzo",
                    "tb": "1",
                    "m": "Break / Almuerzo"
                }
            },
            {
                "r": 6,
                "c": 6,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Break / Almuerzo",
                    "tb": "1",
                    "m": "Break / Almuerzo"
                }
            },
            {
                "r": 7,
                "c": 0,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Afternoon",
                    "tb": "1",
                    "m": "Afternoon",
                    "bg": "#DAEAD4",
                    "bl": 1
                }
            },
            {
                "r": 7,
                "c": 1,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "ETH Day, share week schedule, workshop node support",
                    "tb": "2",
                    "m": "ETH Day, share week schedule, workshop node support"
                }
            },
            {
                "r": 7,
                "c": 2,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "inlineStr",
                        "s": [
                            {
                                "v": "14:00 – 14:45\r\nMini workshop: Node operator workshop with Lido CSM – Enti (Lido)\r\n\r\n\r\n14:45 – 15:30\r\nMini Workshop: Operating Validators in 2026: Metrics, Alerts and Resilient Setups — SEEDNodes (Mateo Emilio)\r\n\r\n\r\n15:30 – 17:00\r\nWorkshop/Talk (1 – 1.5 hrs): Introduction to nodes and validators for university students – Sr. Wilbur (SEEDNodes)\r\n\r\n\r\n17:00 – 17:45\r\nMini workshop: How to deploy an Obol DVT cluster using Hooid (hands-on technical) — Lorenzo",
                                "fs": 10,
                                "tb": "2"
                            }
                        ]
                    },
                    "tb": "2",
                    "fs": 10
                }
            },
            {
                "r": 7,
                "c": 3,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "inlineStr",
                        "s": [
                            {
                                "v": "1:30 PM: Lean Ethereum keynote\r\n\r\n\r\n2 PM: The State of Node Operations and DVT\r\nDuration: 20 mins\r\nSpeaker: Ariel\r\n\r\n\r\n2:30 PM: Validators beyond the L1 | The economics of validator rewards\r\nUnlocking the Next Frontier of a unified Ethereum\r\nDuration: 20 mins\r\nSpeaker: Lior\r\n\r\n\r\n3 PM: Panel | Node operations for institutions\r\nDuration: 30 mins\r\n\r\n\r\n3:45 PM: Final fireside | The Greater & Leaner Ethereum\r\nDuration: 20 min\r\n\r\n\r\n4:10 PM: Closing address\r\nDuration: 20 mins\r\nSpeaker: Alon\r\nClosing notes + open floor for Q&A.\r\n\r\n\r\nFollowing this:\r\nEncourage operator introductions, open mic Q&A, hands-on DVT + demos.",
                                "fs": 10,
                                "tb": "2"
                            }
                        ]
                    },
                    "tb": "2",
                    "fs": 10
                }
            },
            {
                "r": 7,
                "c": 4,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "inlineStr",
                        "s": [
                            {
                                "v": "2:00 pm Learnings & Key Metrics after 4 years expanding ethereum infra beyond existing\r\n\r\n\r\n\r\n\r\n3:00 pm Ask me Anything SecDevOps & Blockchain Engineer\r\n\r\n\r\n\r\n\r\n4:00 pm How to scale from 1 to 1,000s of validators a DevOps perspective Ricardo Bart\r\n\r\n\r\n\r\n\r\n5:00 pm Ask me Anything"
                            }
                        ]
                    },
                    "tb": "2",
                    "fs": 10
                }
            },
            {
                "r": 7,
                "c": 5,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Fix My Node live troubleshooting experience demo",
                    "tb": "1",
                    "m": "Fix My Node live troubleshooting experience demo"
                }
            },
            {
                "r": 7,
                "c": 6,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Workshop and revisit topics from the week",
                    "tb": "2",
                    "m": "Workshop and revisit topics from the week"
                }
            }
        ]
    },
    {
        "name": "Sheet2",
        "status": 0,
        "order": 1,
        "id": "4c727be2-e8df-4ce0-864a-1f10e15be8bc",
        "row": 84,
        "column": 60,
        "config": {
            "merge": {
                "0_0": {
                    "r": 0,
                    "c": 0,
                    "rs": 1,
                    "cs": 8
                }
            },
            "rowlen": {
                "0": 29,
                "1": 22,
                "2": 22,
                "3": 22,
                "4": 22,
                "5": 465,
                "6": 22,
                "7": 450,
                "8": 22,
                "9": 22,
                "10": 22,
                "11": 22,
                "12": 22,
                "13": 22,
                "14": 22,
                "15": 22,
                "16": 22,
                "17": 22,
                "18": 22,
                "19": 22,
                "20": 22,
                "21": 22,
                "22": 22,
                "23": 22,
                "24": 22,
                "25": 22,
                "26": 22,
                "27": 22,
                "28": 22,
                "29": 22,
                "30": 22,
                "31": 22,
                "32": 22,
                "33": 22,
                "34": 22,
                "35": 22,
                "36": 22,
                "37": 22,
                "38": 22,
                "39": 22,
                "40": 22,
                "41": 22,
                "42": 22,
                "43": 22,
                "44": 22,
                "45": 22,
                "46": 22,
                "47": 22,
                "48": 22,
                "49": 22,
                "50": 22,
                "51": 22,
                "52": 22,
                "53": 22,
                "54": 22,
                "55": 22,
                "56": 22,
                "57": 22,
                "58": 22,
                "59": 22,
                "60": 22,
                "61": 22,
                "62": 22,
                "63": 22,
                "64": 22,
                "65": 22,
                "66": 22,
                "67": 22,
                "68": 22,
                "69": 22,
                "70": 22,
                "71": 22,
                "72": 22,
                "73": 22,
                "74": 22,
                "75": 22,
                "76": 22,
                "77": 22,
                "78": 22,
                "79": 22,
                "80": 22,
                "81": 22,
                "82": 22,
                "83": 22,
                "84": 22,
                "85": 22,
                "86": 22,
                "87": 22,
                "88": 22,
                "89": 22,
                "90": 22,
                "91": 22,
                "92": 22,
                "93": 22,
                "94": 22,
                "95": 22,
                "96": 22,
                "97": 22,
                "98": 22,
                "99": 22,
                "100": 22,
                "101": 22,
                "102": 22,
                "103": 22,
                "104": 22,
                "105": 22,
                "106": 22,
                "107": 22,
                "108": 22,
                "109": 22,
                "110": 22,
                "111": 22,
                "112": 22,
                "113": 22,
                "114": 22,
                "115": 22,
                "116": 22,
                "117": 22,
                "118": 22,
                "119": 22,
                "120": 22,
                "121": 22,
                "122": 22,
                "123": 22,
                "124": 22,
                "125": 22,
                "126": 22,
                "127": 22,
                "128": 22,
                "129": 22,
                "130": 22,
                "131": 22,
                "132": 22,
                "133": 22,
                "134": 22,
                "135": 22,
                "136": 22,
                "137": 22,
                "138": 22,
                "139": 22,
                "140": 22,
                "141": 22,
                "142": 22,
                "143": 22,
                "144": 22,
                "145": 22,
                "146": 22,
                "147": 22,
                "148": 22,
                "149": 22,
                "150": 22,
                "151": 22,
                "152": 22,
                "153": 22,
                "154": 22,
                "155": 22,
                "156": 22,
                "157": 22,
                "158": 22,
                "159": 22,
                "160": 22,
                "161": 22,
                "162": 22,
                "163": 22,
                "164": 22,
                "165": 22,
                "166": 22,
                "167": 22,
                "168": 22,
                "169": 22,
                "170": 22,
                "171": 22,
                "172": 22,
                "173": 22,
                "174": 22,
                "175": 22,
                "176": 22,
                "177": 22,
                "178": 22,
                "179": 22,
                "180": 22,
                "181": 22,
                "182": 22,
                "183": 22,
                "184": 22,
                "185": 22,
                "186": 22,
                "187": 22,
                "188": 22,
                "189": 22,
                "190": 22,
                "191": 22,
                "192": 22,
                "193": 22,
                "194": 22,
                "195": 22,
                "196": 22,
                "197": 22,
                "198": 22,
                "199": 22,
                "200": 22,
                "201": 22,
                "202": 22,
                "203": 22,
                "204": 22,
                "205": 22,
                "206": 22,
                "207": 22,
                "208": 22,
                "209": 22,
                "210": 22,
                "211": 22,
                "212": 22,
                "213": 22,
                "214": 22,
                "215": 22,
                "216": 22,
                "217": 22,
                "218": 22,
                "219": 22,
                "220": 22,
                "221": 22,
                "222": 22,
                "223": 22,
                "224": 22,
                "225": 22,
                "226": 22,
                "227": 22,
                "228": 22,
                "229": 22,
                "230": 22,
                "231": 22,
                "232": 22,
                "233": 22,
                "234": 22,
                "235": 22,
                "236": 22,
                "237": 22,
                "238": 22,
                "239": 22,
                "240": 22,
                "241": 22,
                "242": 22,
                "243": 22,
                "244": 22,
                "245": 22,
                "246": 22,
                "247": 22,
                "248": 22,
                "249": 22,
                "250": 22,
                "251": 22,
                "252": 22,
                "253": 22,
                "254": 22,
                "255": 22,
                "256": 22,
                "257": 22,
                "258": 22,
                "259": 22,
                "260": 22,
                "261": 22,
                "262": 22,
                "263": 22,
                "264": 22,
                "265": 22,
                "266": 22,
                "267": 22,
                "268": 22,
                "269": 22,
                "270": 22,
                "271": 22,
                "272": 22,
                "273": 22,
                "274": 22,
                "275": 22,
                "276": 22,
                "277": 22,
                "278": 22,
                "279": 22,
                "280": 22,
                "281": 22,
                "282": 22,
                "283": 22,
                "284": 22,
                "285": 22,
                "286": 22,
                "287": 22,
                "288": 22,
                "289": 22,
                "290": 22,
                "291": 22,
                "292": 22,
                "293": 22,
                "294": 22,
                "295": 22,
                "296": 22,
                "297": 22,
                "298": 22,
                "299": 22,
                "300": 22,
                "301": 22,
                "302": 22,
                "303": 22,
                "304": 22,
                "305": 22,
                "306": 22,
                "307": 22,
                "308": 22,
                "309": 22,
                "310": 22,
                "311": 22,
                "312": 22,
                "313": 22,
                "314": 22,
                "315": 22,
                "316": 22,
                "317": 22,
                "318": 22,
                "319": 22,
                "320": 22,
                "321": 22,
                "322": 22,
                "323": 22,
                "324": 22,
                "325": 22,
                "326": 22,
                "327": 22,
                "328": 22,
                "329": 22,
                "330": 22,
                "331": 22,
                "332": 22,
                "333": 22,
                "334": 22,
                "335": 22,
                "336": 22,
                "337": 22,
                "338": 22,
                "339": 22,
                "340": 22,
                "341": 22,
                "342": 22,
                "343": 22,
                "344": 22,
                "345": 22,
                "346": 22,
                "347": 22,
                "348": 22,
                "349": 22,
                "350": 22,
                "351": 22,
                "352": 22,
                "353": 22,
                "354": 22,
                "355": 22,
                "356": 22,
                "357": 22,
                "358": 22,
                "359": 22,
                "360": 22,
                "361": 22,
                "362": 22,
                "363": 22,
                "364": 22,
                "365": 22,
                "366": 22,
                "367": 22,
                "368": 22,
                "369": 22,
                "370": 22,
                "371": 22,
                "372": 22,
                "373": 22,
                "374": 22,
                "375": 22,
                "376": 22,
                "377": 22,
                "378": 22,
                "379": 22,
                "380": 22,
                "381": 22,
                "382": 22,
                "383": 22,
                "384": 22,
                "385": 22,
                "386": 22,
                "387": 22,
                "388": 22,
                "389": 22,
                "390": 22,
                "391": 22,
                "392": 22,
                "393": 22,
                "394": 22,
                "395": 22,
                "396": 22,
                "397": 22,
                "398": 22,
                "399": 22,
                "400": 22,
                "401": 22,
                "402": 22,
                "403": 22,
                "404": 22,
                "405": 22,
                "406": 22,
                "407": 22,
                "408": 22,
                "409": 22,
                "410": 22,
                "411": 22,
                "412": 22,
                "413": 22,
                "414": 22,
                "415": 22,
                "416": 22,
                "417": 22,
                "418": 22,
                "419": 22,
                "420": 22,
                "421": 22,
                "422": 22,
                "423": 22,
                "424": 22,
                "425": 22,
                "426": 22,
                "427": 22,
                "428": 22,
                "429": 22,
                "430": 22,
                "431": 22,
                "432": 22,
                "433": 22,
                "434": 22,
                "435": 22,
                "436": 22,
                "437": 22,
                "438": 22,
                "439": 22,
                "440": 22,
                "441": 22,
                "442": 22,
                "443": 22,
                "444": 22,
                "445": 22,
                "446": 22,
                "447": 22,
                "448": 22,
                "449": 22,
                "450": 22,
                "451": 22,
                "452": 22,
                "453": 22,
                "454": 22,
                "455": 22,
                "456": 22,
                "457": 22,
                "458": 22,
                "459": 22,
                "460": 22,
                "461": 22,
                "462": 22,
                "463": 22,
                "464": 22,
                "465": 22,
                "466": 22,
                "467": 22,
                "468": 22,
                "469": 22,
                "470": 22,
                "471": 22,
                "472": 22,
                "473": 22,
                "474": 22,
                "475": 22,
                "476": 22,
                "477": 22,
                "478": 22,
                "479": 22,
                "480": 22,
                "481": 22,
                "482": 22,
                "483": 22,
                "484": 22,
                "485": 22,
                "486": 22,
                "487": 22,
                "488": 22,
                "489": 22,
                "490": 22,
                "491": 22,
                "492": 22,
                "493": 22,
                "494": 22,
                "495": 22,
                "496": 22,
                "497": 22,
                "498": 22,
                "499": 22
            },
            "columnlen": {
                "0": 657,
                "1": 313,
                "2": 518,
                "3": 548,
                "4": 409,
                "5": 398,
                "6": 413,
                "7": 104,
                "8": 104,
                "9": 104,
                "10": 104,
                "11": 104,
                "12": 104,
                "13": 104,
                "14": 104,
                "15": 104,
                "16": 104,
                "17": 104,
                "18": 104,
                "19": 104,
                "20": 104,
                "21": 104,
                "22": 104,
                "23": 104,
                "24": 104,
                "25": 104,
                "26": 104,
                "27": 104,
                "28": 104,
                "29": 104,
                "30": 104,
                "31": 104,
                "32": 104,
                "33": 104,
                "34": 104,
                "35": 104
            }
        },
        "pivotTable": null,
        "isPivotTable": false,
        "zoomRatio": 1,
        "calcChain": [],
        "luckysheet_conditionformat_save": null,
        "luckysheet_alternateformat_save": [],
        "dataVerification": {},
        "hyperlink": {},
        "luckysheet_select_save": [
            {
                "row": [
                    84,
                    499
                ],
                "column": [
                    0,
                    59
                ]
            }
        ],
        "celldata": [
            {
                "r": 0,
                "c": 0,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Node Operator Community Hub Schedule – Devconnect ARG, Buenos Aires",
                    "tb": "1",
                    "m": "Node Operator Community Hub Schedule – Devconnect ARG, Buenos Aires",
                    "fs": 18,
                    "bl": 1,
                    "mc": {
                        "r": 0,
                        "c": 0,
                        "rs": 1,
                        "cs": 8
                    }
                }
            },
            {
                "r": 0,
                "c": 1,
                "v": {
                    "mc": {
                        "r": 0,
                        "c": 0
                    }
                }
            },
            {
                "r": 0,
                "c": 2,
                "v": {
                    "mc": {
                        "r": 0,
                        "c": 0
                    }
                }
            },
            {
                "r": 0,
                "c": 3,
                "v": {
                    "mc": {
                        "r": 0,
                        "c": 0
                    }
                }
            },
            {
                "r": 0,
                "c": 4,
                "v": {
                    "mc": {
                        "r": 0,
                        "c": 0
                    }
                }
            },
            {
                "r": 0,
                "c": 5,
                "v": {
                    "mc": {
                        "r": 0,
                        "c": 0
                    }
                }
            },
            {
                "r": 0,
                "c": 6,
                "v": {
                    "mc": {
                        "r": 0,
                        "c": 0
                    }
                }
            },
            {
                "r": 0,
                "c": 7,
                "v": {
                    "mc": {
                        "r": 0,
                        "c": 0
                    }
                }
            },
            {
                "r": 2,
                "c": 0,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Date",
                    "tb": "1",
                    "m": "Date",
                    "bl": 1,
                    "bg": "#D9D3E8"
                }
            },
            {
                "r": 2,
                "c": 1,
                "v": {
                    "m": "Monday Nov 17",
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Monday Nov 17",
                    "bl": 1,
                    "bg": "#D9D3E8"
                }
            },
            {
                "r": 2,
                "c": 2,
                "v": {
                    "m": "Tuesday Nov 18",
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Tuesday Nov 18",
                    "bl": 1,
                    "bg": "#D9D3E8"
                }
            },
            {
                "r": 2,
                "c": 3,
                "v": {
                    "m": "Wednesday Nov 19",
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Wednesday Nov 19",
                    "bl": 1,
                    "bg": "#D9D3E8"
                }
            },
            {
                "r": 2,
                "c": 4,
                "v": {
                    "m": "Thursday Nov 20",
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Thursday Nov 20",
                    "bl": 1,
                    "bg": "#D9D3E8"
                }
            },
            {
                "r": 2,
                "c": 5,
                "v": {
                    "m": "Friday Nov 21",
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Friday Nov 21",
                    "bl": 1,
                    "bg": "#D9D3E8"
                }
            },
            {
                "r": 2,
                "c": 6,
                "v": {
                    "m": "Saturday Nov 22",
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Saturday Nov 22",
                    "bl": 1,
                    "bg": "#D9D3E8"
                }
            },
            {
                "r": 3,
                "c": 0,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Theme / Owner",
                    "tb": "1",
                    "m": "Theme / Owner",
                    "bl": 1,
                    "bg": "#FCE5CF"
                }
            },
            {
                "r": 3,
                "c": 1,
                "v": {
                    "m": "Intro, workshop",
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Intro, workshop",
                    "bl": 1,
                    "bg": "#FCE5CF"
                }
            },
            {
                "r": 3,
                "c": 2,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "SEED",
                    "tb": "1",
                    "m": "SEED",
                    "bl": 1,
                    "bg": "#FCE5CF"
                }
            },
            {
                "r": 3,
                "c": 3,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "SSV",
                    "tb": "1",
                    "m": "SSV",
                    "bl": 1,
                    "bg": "#FCE5CF"
                }
            },
            {
                "r": 3,
                "c": 4,
                "v": {
                    "m": "Sensei Node",
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Sensei Node",
                    "bl": 1,
                    "bg": "#FCE5CF"
                }
            },
            {
                "r": 3,
                "c": 5,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Open Contributions Day",
                    "tb": "1",
                    "m": "Open Contributions Day",
                    "bl": 1,
                    "bg": "#FCE5CF"
                }
            },
            {
                "r": 3,
                "c": 6,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Final / Recap day",
                    "tb": "1",
                    "m": "Final / Recap day",
                    "bl": 1,
                    "bg": "#FCE5CF"
                }
            },
            {
                "r": 4,
                "c": 0,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "tb": "1"
                }
            },
            {
                "r": 5,
                "c": 0,
                "v": {
                    "m": "Morning",
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Morning",
                    "bg": "#C9DBF7",
                    "bl": 1
                }
            },
            {
                "r": 5,
                "c": 1,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "ETH Day, share week schedule, workshop node support",
                    "tb": "2",
                    "m": "ETH Day, share week schedule, workshop node support"
                }
            },
            {
                "r": 5,
                "c": 2,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "inlineStr",
                        "s": [
                            {
                                "v": "09:00 – 09:45\r\nMini workshop: Node operator workshop with Lido CSM – Enti (Lido)\r\n\r\n\r\n10:00 – 10:45\r\nMini Workshop: Operating Validators in 2026: Metrics, Alerts and Resilient Setups — SEEDNodes (Mateo Emilio)\r\n\r\n\r\n11:00 – 12:30\r\nWorkshop/Talk (1 – 1.5 hrs): Introduction to nodes and validators for university students – Sr. Wilbur (SEEDNodes)\r\n\r\n\r\n12:30 – 13:15\r\nMini workshop: How to deploy an Obol DVT cluster using Hooid (hands-on technical) — Lorenzo"
                            }
                        ]
                    },
                    "tb": "2",
                    "fs": 10
                }
            },
            {
                "r": 5,
                "c": 3,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "inlineStr",
                        "s": [
                            {
                                "v": "9:00 AM: Gates open\r\nSetup check, always-on demo running.\r\n\r\n\r\n10:00 AM: Welcome & framing\r\nSpeaker: Alon (SSV Network)\r\nDuration: 20 min\r\nTone: Community-first. “Why we're here — the next stage for node ops and validators.”\r\n\r\n\r\n10:20 AM: Panel | The state of node operations & DVT\r\nDuration: 30 min\r\nGoal: Showcase how distributed validator tech (DVT) is redefining validator resilience, decentralization, and accessibility.\r\n\r\n\r\n11 AM: Lightning talks (3 × 7 min)\r\nShort, high-signal bursts from community projects.\r\nDuration: 25 min\r\nPossible lineup:\r\n– Running a DVT node — SSV community member; GBeans\r\n– MEV and DVT: What’s next for validator rewards — Compose engineer\r\n– Client diversity beyond buzzwords: SigmaPrime\r\n\r\n\r\n11:30 AM: Validators beyond the L1\r\nUnlocking the Next Frontier of a unified Ethereum\r\nDuration: 20 mins\r\n\r\n\r\n12 noon: Panel | Preconfirmations & shared sequencing IRL\r\nDuration: 30 min"
                            }
                        ]
                    },
                    "tb": "2",
                    "fs": 10
                }
            },
            {
                "r": 5,
                "c": 4,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "inlineStr",
                        "s": [
                            {
                                "v": "10:00 am Setting up your first validator Blockchain Engineer\r\n\r\n\r\n\r\n\r\n11:00 am Ask me Anything Blockchain Engineer\r\n\r\n\r\n\r\n\r\n12:00 pm Best Practices on DVT Blockchain Engineer\r\n\r\n\r\n"
                            }
                        ]
                    },
                    "tb": "2",
                    "fs": 10
                }
            },
            {
                "r": 5,
                "c": 5,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "10am How Validators Earn and Lose Rewards (Nico from Node Sentinel)",
                    "tb": "2",
                    "m": "10am How Validators Earn and Lose Rewards (Nico from Node Sentinel)"
                }
            },
            {
                "r": 5,
                "c": 6,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Workshop and revisit topics from the week that were written on whiteboard",
                    "tb": "2",
                    "m": "Workshop and revisit topics from the week that were written on whiteboard"
                }
            },
            {
                "r": 6,
                "c": 0,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Break",
                    "tb": "1",
                    "m": "Break",
                    "bg": "#FCE5CF",
                    "bl": 1
                }
            },
            {
                "r": 6,
                "c": 2,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "13:15 – 14:00 Break / Almuerzo",
                    "tb": "1",
                    "m": "13:15 – 14:00 Break / Almuerzo"
                }
            },
            {
                "r": 6,
                "c": 3,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "12:30 to 1:30: Open networking + pizza break",
                    "tb": "1",
                    "m": "12:30 to 1:30: Open networking + pizza break"
                }
            },
            {
                "r": 6,
                "c": 4,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Break / Almuerzo",
                    "tb": "1",
                    "m": "Break / Almuerzo"
                }
            },
            {
                "r": 6,
                "c": 5,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Break / Almuerzo",
                    "tb": "1",
                    "m": "Break / Almuerzo"
                }
            },
            {
                "r": 6,
                "c": 6,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Break / Almuerzo",
                    "tb": "1",
                    "m": "Break / Almuerzo"
                }
            },
            {
                "r": 7,
                "c": 0,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Afternoon",
                    "tb": "1",
                    "m": "Afternoon",
                    "bg": "#DAEAD4",
                    "bl": 1
                }
            },
            {
                "r": 7,
                "c": 1,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "ETH Day, share week schedule, workshop node support",
                    "tb": "2",
                    "m": "ETH Day, share week schedule, workshop node support"
                }
            },
            {
                "r": 7,
                "c": 2,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "inlineStr",
                        "s": [
                            {
                                "v": "14:00 – 14:45\r\nMini workshop: Node operator workshop with Lido CSM – Enti (Lido)\r\n\r\n\r\n14:45 – 15:30\r\nMini Workshop: Operating Validators in 2026: Metrics, Alerts and Resilient Setups — SEEDNodes (Mateo Emilio)\r\n\r\n\r\n15:30 – 17:00\r\nWorkshop/Talk (1 – 1.5 hrs): Introduction to nodes and validators for university students – Sr. Wilbur (SEEDNodes)\r\n\r\n\r\n17:00 – 17:45\r\nMini workshop: How to deploy an Obol DVT cluster using Hooid (hands-on technical) — Lorenzo"
                            }
                        ]
                    },
                    "tb": "2",
                    "fs": 10
                }
            },
            {
                "r": 7,
                "c": 3,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "inlineStr",
                        "s": [
                            {
                                "v": "1:30 PM: Lean Ethereum keynote\r\n\r\n\r\n2 PM: The State of Node Operations and DVT\r\nDuration: 20 mins\r\nSpeaker: Ariel\r\n\r\n\r\n2:30 PM: Validators beyond the L1 | The economics of validator rewards\r\nUnlocking the Next Frontier of a unified Ethereum\r\nDuration: 20 mins\r\nSpeaker: Lior\r\n\r\n\r\n3 PM: Panel | Node operations for institutions\r\nDuration: 30 mins\r\n\r\n\r\n3:45 PM: Final fireside | The Greater & Leaner Ethereum\r\nDuration: 20 min\r\n\r\n\r\n4:10 PM: Closing address\r\nDuration: 20 mins\r\nSpeaker: Alon\r\nClosing notes + open floor for Q&A.\r\n\r\n\r\nFollowing this:\r\nEncourage operator introductions, open mic Q&A, hands-on DVT + demos."
                            }
                        ]
                    },
                    "tb": "2",
                    "fs": 10
                }
            },
            {
                "r": 7,
                "c": 4,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "inlineStr",
                        "s": [
                            {
                                "v": "2:00 pm Learnings & Key Metrics after 4 years expanding ethereum infra beyond existing\r\n\r\n\r\n\r\n\r\n3:00 pm Ask me Anything SecDevOps & Blockchain Engineer\r\n\r\n\r\n\r\n\r\n4:00 pm How to scale from 1 to 1,000s of validators a DevOps perspective Ricardo Bart\r\n\r\n\r\n\r\n\r\n5:00 pm Ask me Anything"
                            }
                        ]
                    },
                    "tb": "2",
                    "fs": 10
                }
            },
            {
                "r": 7,
                "c": 5,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Fix My Node live troubleshooting experience demo",
                    "tb": "1",
                    "m": "Fix My Node live troubleshooting experience demo"
                }
            },
            {
                "r": 7,
                "c": 6,
                "v": {
                    "ct": {
                        "fa": "General",
                        "t": "g"
                    },
                    "v": "Workshop and revisit topics from the week",
                    "tb": "1",
                    "m": "Workshop and revisit topics from the week"
                }
            }
        ]
    }
]);
  const ref = React.useRef(null);
  const onChange = useCallback((d: Sheet[]) => {
    setData(d);
  }, []);
  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <Workbook
      isFlvReadOnly={false}
        ref={ref}
        {...args}
        data={data}
        rowHeaderWidth={60}
        columnHeaderHeight={24}
        defaultColWidth={100}
        defaultRowHeight={21}
        onChange={onChange}
        isAuthorized={false}
        getCommentCellUI={(r,c,mouseDownHandler) => {
          return (
            <div
              onMouseDown={mouseDownHandler}
              style={{
                position: "absolute",
                left: c-40,
                top: r,
                width: 100,
                height: 21,
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                border: "1px solid #ccc",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              }}
            >
              Comment
            </div>
          );
        }}
        customToolbarItems={[
          // {
          //   key: "templates",
          //   tooltip: "Templates",
          //   // onClick: toggleTemplateSidebar,
          // },
          {
            key: "ethereum",
            tooltip: "Crypto denominations",
            // onClick: () => { },
          },
        ]}
        toolbarItems={[
          "undo",
          "redo",
          "format-painter",
          "|",
          "font",
          "|",
          "font-size",
          "|",
          "bold",
          "italic",
          "strike-through",
          "|",
          "font-color",
          "background",
          "|",
          "border",
          "merge-cell",
          "|",
          "horizontal-align",
          "text-wrap",
          "vertical-align",
          "|",
          "currency",
          "percentage-format",
          "number-decrease",
          "number-increase",
          "format",
          "|",
          "conditionFormat",
          "filter",
          "|",
          "link",
          "comment",
          "image",
          "quick-formula",
          "dataVerification",
          "search",
        ]}
        cellContextMenu={[
          "cut",
          "copy",
          "paste",
          "clear",
          "|",
          "insert-row",
          "insert-row-above",
          "insert-column",
          "insert-column-right",
          "cell-delete-row",
          "cell-delete-column",
          // "delete-cell",
          // "hide-row",
          // "hide-column",
          // "set-row-height",
          // "set-column-width",
          "|",
          "conditionFormat",
          "filter",
          "searchReplace",
          "dataVerification",
          "ascSort",
          "desSort",
          "|",
          "chart",
          // 'image',
          "link",
          "data",
          "cell-format",
          "comment",
          "freeze-row",
          "freeze-column",
          "|",
          "clear-format",
        ]}
        headerContextMenu={[
          "cut",
          "copy",
          "paste",
          "clear",
          "|",
          "insert-row",
          "insert-row-above",
          "insert-column",
          "insert-column-right",
          "delete-row",
          "delete-column",
          // "delete-cell",
          "hide-row",
          "hide-column",
          "set-row-height",
          "set-column-width",
          "|",
          "conditionFormat",
          "filter",
          // 'searchReplace',
          "dataVerification",
          "ascSort",
          "desSort",
          "|",
          // 'chart',
          // 'image',
          // 'link',
          "data",
          "cell-format",
          // 'comment',
          "split-text",
          "freeze-row",
          "freeze-column",
          "|",
          "clear-format",
        ]}
      />
    </div>
  );
};

export const Basic = Template.bind({});
// @ts-ignore
Basic.args = { data: [cell] };

export const Formula = Template.bind({});
// @ts-ignore
Formula.args = { data: [formula] };

export const Empty = Template.bind({});
Empty.args = { data: [empty] };

export const Tabs = Template.bind({});
// @ts-ignore
Tabs.args = { data: [cell, formula] };

export const Freeze = Template.bind({});
// @ts-ignore
Freeze.args = { data: [freeze] };

export const DataVerification = Template.bind({});
// @ts-ignore
DataVerification.args = { data: [dataVerification] };

export const ProtectedSheet = Template.bind({});
// @ts-ignore
ProtectedSheet.args = {
  data: lockcellData,
};

export const MultiInstance: StoryFn<typeof Workbook> = () => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
      }}
    >
      <div
        style={{
          display: "inline-block",
          width: "50%",
          height: "100%",
          paddingRight: "12px",
          boxSizing: "border-box",
        }}
      >
        <Workbook data={[empty]} />
      </div>
      <div
        style={{
          display: "inline-block",
          width: "50%",
          height: "100%",
          paddingLeft: "12px",
          boxSizing: "border-box",
        }}
      >
        <Workbook data={[empty]} />
      </div>
    </div>
  );
};
