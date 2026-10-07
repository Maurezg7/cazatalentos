// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console2} from "forge-std/Script.sol";
import {Cazatalentos} from "../src/Cazatalentos.sol";

contract Deploy is Script {
    function run() external returns (Cazatalentos) {
        vm.startBroadcast();
        Cazatalentos c = new Cazatalentos(0.001 ether, 48 hours, 90 days, 2000, 5000);
        vm.stopBroadcast();
        console2.log("Cazatalentos deployed at", address(c));
        return c;
    }
}
