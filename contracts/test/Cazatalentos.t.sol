// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {Cazatalentos} from "../src/Cazatalentos.sol";
import {ICazatalentos} from "../src/ICazatalentos.sol";

/// @dev External CREATE wrapper so constructor revert branches survive forge coverage.
contract CazatalentosDeployer {
    function deploy(
        uint256 minStake,
        uint64 voteWindow,
        uint64 maxPoolDuration,
        uint16 quorumBps,
        uint16 approvalBps
    ) external returns (Cazatalentos) {
        return new Cazatalentos(minStake, voteWindow, maxPoolDuration, quorumBps, approvalBps);
    }
}

contract CazatalentosTest is Test {
    Cazatalentos internal cazatalentos;

    address internal owner;
    address internal alice;
    address internal bob;

    uint256 internal constant MIN_STAKE = 0.001 ether;
    uint64 internal constant VOTE_WINDOW = 48 hours;
    uint64 internal constant MAX_POOL_DURATION = 90 days;
    uint16 internal constant QUORUM_BPS = 2000;
    uint16 internal constant APPROVAL_BPS = 5000;

    string internal constant URI = "ipfs://artist-1";

    function setUp() public {
        owner = makeAddr("owner");
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        cazatalentos = _deploy();
    }

    function _deploy() internal returns (Cazatalentos) {
        return new Cazatalentos(MIN_STAKE, VOTE_WINDOW, MAX_POOL_DURATION, QUORUM_BPS, APPROVAL_BPS);
    }

    function _expectedWeight(uint32 rank) internal pure returns (uint8) {
        if (rank == 0) revert("rank");
        if (rank <= 10) return 5;
        if (rank <= 50) return 3;
        if (rank <= 200) return 2;
        return 1;
    }

    // 1
    function test_RegisterArtist_HappyPath() public {
        vm.prank(owner);
        uint256 artistId = cazatalentos.registerArtist(URI);

        assertEq(artistId, 1);
        assertEq(cazatalentos.totalArtists(), 1);

        ICazatalentos.Artist memory artist = cazatalentos.artistOf(artistId);
        assertEq(artist.owner, owner);
        assertEq(artist.supporterCount, 0);
        assertEq(artist.metadataURI, URI);
        assertTrue(artist.exists);
    }

    // 2
    function test_RegisterArtist_IdIncrements() public {
        vm.prank(owner);
        uint256 first = cazatalentos.registerArtist(URI);
        vm.prank(alice);
        uint256 second = cazatalentos.registerArtist("ipfs://artist-2");

        assertEq(first, 1);
        assertEq(second, 2);
        assertEq(cazatalentos.totalArtists(), 2);
    }

    // 3
    function test_RegisterArtist_RevertsOnEmptyURI() public {
        vm.prank(owner);
        vm.expectRevert(ICazatalentos.EmptyMetadataURI.selector);
        cazatalentos.registerArtist("");
    }

    // 4
    function test_RegisterArtist_EmitsEvent() public {
        vm.prank(owner);
        vm.expectEmit(true, true, false, true);
        emit ICazatalentos.ArtistRegistered(1, owner, URI);
        cazatalentos.registerArtist(URI);
    }

    // 5
    function test_SignBelief_HappyPath() public {
        vm.prank(owner);
        uint256 artistId = cazatalentos.registerArtist(URI);

        vm.deal(alice, 1 ether);
        vm.prank(alice);
        cazatalentos.signBelief{value: MIN_STAKE}(artistId);

        ICazatalentos.Supporter memory supporter = cazatalentos.supporterOf(artistId, alice);
        assertEq(supporter.rank, 1);
        assertEq(supporter.weight, 5);
        assertEq(supporter.signedAt, uint64(block.timestamp));
        assertEq(supporter.stake, MIN_STAKE);
        assertEq(cazatalentos.stakedByArtist(artistId), MIN_STAKE);
        assertEq(cazatalentos.artistOf(artistId).supporterCount, 1);
    }

    // 6
    function test_SignBelief_RevertsOnUnknownArtist() public {
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(ICazatalentos.ArtistDoesNotExist.selector, 1));
        cazatalentos.signBelief{value: MIN_STAKE}(1);
    }

    // 7
    function test_SignBelief_RevertsOnArtistOwner() public {
        vm.prank(owner);
        uint256 artistId = cazatalentos.registerArtist(URI);

        vm.deal(owner, 1 ether);
        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(ICazatalentos.ArtistOwnerCannotSign.selector, artistId, owner)
        );
        cazatalentos.signBelief{value: MIN_STAKE}(artistId);
    }

    // 8
    function test_SignBelief_RevertsOnAlreadySigned() public {
        vm.prank(owner);
        uint256 artistId = cazatalentos.registerArtist(URI);

        vm.deal(alice, 2 ether);
        vm.prank(alice);
        cazatalentos.signBelief{value: MIN_STAKE}(artistId);

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(ICazatalentos.AlreadySigned.selector, artistId, alice)
        );
        cazatalentos.signBelief{value: MIN_STAKE}(artistId);
    }

    // 9
    function test_SignBelief_RevertsOnLowStake() public {
        vm.prank(owner);
        uint256 artistId = cazatalentos.registerArtist(URI);

        uint256 low = MIN_STAKE - 1;
        vm.deal(alice, low);
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(ICazatalentos.InsufficientStake.selector, low, MIN_STAKE)
        );
        cazatalentos.signBelief{value: low}(artistId);
    }

    // 10
    function test_SignBelief_RankIncrements() public {
        vm.prank(owner);
        uint256 artistId = cazatalentos.registerArtist(URI);

        vm.deal(alice, 1 ether);
        vm.deal(bob, 1 ether);

        vm.prank(alice);
        cazatalentos.signBelief{value: MIN_STAKE}(artistId);
        vm.prank(bob);
        cazatalentos.signBelief{value: MIN_STAKE}(artistId);

        assertEq(cazatalentos.supporterOf(artistId, alice).rank, 1);
        assertEq(cazatalentos.supporterOf(artistId, bob).rank, 2);
        assertEq(cazatalentos.artistOf(artistId).supporterCount, 2);
    }

    // 11
    function test_SignBelief_StakeAccumulates() public {
        vm.prank(owner);
        uint256 artistId = cazatalentos.registerArtist(URI);

        uint256 aliceStake = MIN_STAKE;
        uint256 bobStake = 0.05 ether;
        vm.deal(alice, aliceStake);
        vm.deal(bob, bobStake);

        vm.prank(alice);
        cazatalentos.signBelief{value: aliceStake}(artistId);
        vm.prank(bob);
        cazatalentos.signBelief{value: bobStake}(artistId);

        assertEq(cazatalentos.stakedByArtist(artistId), aliceStake + bobStake);
        assertEq(cazatalentos.supporterOf(artistId, alice).stake, aliceStake);
        assertEq(cazatalentos.supporterOf(artistId, bob).stake, bobStake);
    }

    // 12
    function test_WeightForRank_Boundaries() public view {
        assertEq(cazatalentos.weightForRank(1), 5);
        assertEq(cazatalentos.weightForRank(10), 5);
        assertEq(cazatalentos.weightForRank(11), 3);
        assertEq(cazatalentos.weightForRank(50), 3);
        assertEq(cazatalentos.weightForRank(51), 2);
        assertEq(cazatalentos.weightForRank(200), 2);
        assertEq(cazatalentos.weightForRank(201), 1);
        assertEq(cazatalentos.weightForRank(5000), 1);
    }

    // 13
    function test_WeightForRank_RevertsOnZero() public {
        vm.expectRevert(abi.encodeWithSelector(ICazatalentos.InvalidParameter.selector, "rank"));
        cazatalentos.weightForRank(0);
    }

    // 14
    function test_Constructor_RevertsOnInvalidParams() public {
        CazatalentosDeployer deployer = new CazatalentosDeployer();

        // 1. minStake = 0
        vm.expectRevert(abi.encodeWithSelector(ICazatalentos.InvalidParameter.selector, "minStake"));
        deployer.deploy(0, VOTE_WINDOW, MAX_POOL_DURATION, QUORUM_BPS, APPROVAL_BPS);

        // 2. voteWindow = 0
        vm.expectRevert(
            abi.encodeWithSelector(ICazatalentos.InvalidParameter.selector, "voteWindow")
        );
        deployer.deploy(MIN_STAKE, 0, MAX_POOL_DURATION, QUORUM_BPS, APPROVAL_BPS);

        // 3. maxPoolDuration = 0
        vm.expectRevert(
            abi.encodeWithSelector(ICazatalentos.InvalidParameter.selector, "maxPoolDuration")
        );
        deployer.deploy(MIN_STAKE, VOTE_WINDOW, 0, QUORUM_BPS, APPROVAL_BPS);

        // 4. quorumBps = 0
        vm.expectRevert(
            abi.encodeWithSelector(ICazatalentos.InvalidParameter.selector, "quorumBps")
        );
        deployer.deploy(MIN_STAKE, VOTE_WINDOW, MAX_POOL_DURATION, 0, APPROVAL_BPS);

        // 5. quorumBps = 10_001
        vm.expectRevert(
            abi.encodeWithSelector(ICazatalentos.InvalidParameter.selector, "quorumBps")
        );
        deployer.deploy(MIN_STAKE, VOTE_WINDOW, MAX_POOL_DURATION, 10_001, APPROVAL_BPS);

        // 6. approvalBps = 0
        vm.expectRevert(
            abi.encodeWithSelector(ICazatalentos.InvalidParameter.selector, "approvalBps")
        );
        deployer.deploy(MIN_STAKE, VOTE_WINDOW, MAX_POOL_DURATION, QUORUM_BPS, 0);

        // 7. approvalBps = 10_001
        vm.expectRevert(
            abi.encodeWithSelector(ICazatalentos.InvalidParameter.selector, "approvalBps")
        );
        deployer.deploy(MIN_STAKE, VOTE_WINDOW, MAX_POOL_DURATION, QUORUM_BPS, 10_001);
    }

    function test_Constructor_AcceptsMaxBps() public {
        Cazatalentos c = new Cazatalentos(MIN_STAKE, VOTE_WINDOW, MAX_POOL_DURATION, 10_000, 10_000);
        assertEq(c.MIN_STAKE(), MIN_STAKE);
        assertEq(c.VOTE_WINDOW(), VOTE_WINDOW);
        assertEq(c.MAX_POOL_DURATION(), MAX_POOL_DURATION);
        assertEq(c.QUORUM_BPS(), 10_000);
        assertEq(c.APPROVAL_BPS(), 10_000);
    }

    function test_ArtistOf_RevertsOnUnknownArtist() public {
        vm.expectRevert(abi.encodeWithSelector(ICazatalentos.ArtistDoesNotExist.selector, 1));
        cazatalentos.artistOf(1);
    }

    // 15
    function testFuzz_SignBelief_RankIsCountPlusOne(uint8 n) public {
        n = uint8(bound(n, 1, 50));

        vm.prank(owner);
        uint256 artistId = cazatalentos.registerArtist(URI);

        for (uint8 i = 0; i < n; ++i) {
            address supporter = makeAddr(string(abi.encodePacked("supporter-", vm.toString(i))));
            vm.deal(supporter, MIN_STAKE);
            vm.prank(supporter);
            cazatalentos.signBelief{value: MIN_STAKE}(artistId);

            assertEq(cazatalentos.supporterOf(artistId, supporter).rank, uint32(i) + 1);
        }

        assertEq(cazatalentos.artistOf(artistId).supporterCount, n);
    }

    // 16
    function testFuzz_SignBelief_StakeAlwaysAccumulates(uint96 amount) public {
        amount = uint96(bound(amount, MIN_STAKE, 100 ether));

        vm.prank(owner);
        uint256 artistId = cazatalentos.registerArtist(URI);

        vm.deal(alice, amount);
        vm.prank(alice);
        cazatalentos.signBelief{value: amount}(artistId);

        assertEq(cazatalentos.stakedByArtist(artistId), amount);
        assertEq(cazatalentos.supporterOf(artistId, alice).stake, amount);
    }

    // 17
    function testFuzz_WeightForRank_MatchesTable(uint32 rank) public view {
        rank = uint32(bound(rank, 1, 10_000));
        assertEq(cazatalentos.weightForRank(rank), _expectedWeight(rank));
    }
}
