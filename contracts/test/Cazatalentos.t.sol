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

/// @dev Rejects native transfers so TransferFailed branches can be exercised.
contract RejectEther {
    function sign(Cazatalentos c, uint256 artistId) external payable {
        c.signBelief{value: msg.value}(artistId);
    }

    function register(Cazatalentos c, string calldata uri) external returns (uint256) {
        return c.registerArtist(uri);
    }

    function open(Cazatalentos c, uint256 artistId, bytes32 hash, uint64 deadline)
        external
        payable
        returns (uint256)
    {
        return c.openPool{value: msg.value}(artistId, hash, deadline);
    }

    function claimMilestone(Cazatalentos c, uint256 poolId, string calldata evidenceURI) external {
        c.claimMilestone(poolId, evidenceURI);
    }

    function vote(Cazatalentos c, uint256 poolId, bool approve) external {
        c.vote(poolId, approve);
    }

    function claimReward(Cazatalentos c, uint256 poolId) external {
        c.claimReward(poolId);
    }

    function reclaim(Cazatalentos c, uint256 poolId) external {
        c.reclaimPool(poolId);
    }

    function withdraw(Cazatalentos c, uint256 artistId) external {
        c.withdrawStake(artistId);
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

    function _createArtist(address artist, string memory uri) internal returns (uint256) {
        vm.prank(artist);
        return cazatalentos.registerArtist(uri);
    }

    function _signAs(address supporter, uint256 artistId) internal {
        vm.deal(supporter, supporter.balance + MIN_STAKE);
        vm.prank(supporter);
        cazatalentos.signBelief{value: MIN_STAKE}(artistId);
    }

    function _openPool(address artist, uint256 artistId, uint256 amount, uint64 deadline)
        internal
        returns (uint256)
    {
        vm.deal(artist, artist.balance + amount);
        vm.prank(artist);
        return cazatalentos.openPool{value: amount}(artistId, keccak256("milestone"), deadline);
    }

    function _supporter(uint256 i) internal returns (address) {
        return makeAddr(string(abi.encodePacked("supporter-", vm.toString(i))));
    }

    function _signMany(uint256 artistId, uint256 n) internal returns (address[] memory supporters) {
        supporters = new address[](n);
        for (uint256 i = 0; i < n; ++i) {
            supporters[i] = _supporter(i);
            _signAs(supporters[i], artistId);
        }
    }

    function _deadline(uint64 offset) internal view returns (uint64) {
        return uint64(block.timestamp + offset);
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

    // --- Phase 2: openPool ---

    function test_OpenPool_HappyPath() public {
        uint256 artistId = _createArtist(owner, URI);
        _signAs(alice, artistId);
        uint64 deadline = _deadline(7 days);

        uint256 poolId = _openPool(owner, artistId, 1 ether, deadline);
        ICazatalentos.Pool memory p = cazatalentos.poolOf(poolId);

        assertEq(poolId, 1);
        assertEq(p.artistId, artistId);
        assertEq(p.amount, 1 ether);
        assertEq(p.milestoneHash, keccak256("milestone"));
        assertEq(p.deadline, deadline);
        assertEq(p.voteEnd, 0);
        assertEq(p.votesFor, 0);
        assertEq(p.votesAgainst, 0);
        assertEq(p.supportersAtOpen, 1);
        assertEq(p.totalWeightAtOpen, 5);
        assertEq(uint256(p.status), uint256(ICazatalentos.PoolStatus.Open));
        assertEq(bytes(p.evidenceURI).length, 0);
        assertEq(cazatalentos.activePoolsByArtist(artistId), 1);
        assertEq(cazatalentos.totalPools(), 1);
    }

    function test_OpenPool_RevertsOnNonArtist() public {
        uint256 artistId = _createArtist(owner, URI);
        _signAs(alice, artistId);

        vm.deal(alice, 1 ether);
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(ICazatalentos.NotArtistOwner.selector, artistId, alice)
        );
        cazatalentos.openPool{value: 1 ether}(artistId, bytes32(0), _deadline(7 days));
    }

    function test_OpenPool_RevertsOnZeroAmount() public {
        uint256 artistId = _createArtist(owner, URI);
        _signAs(alice, artistId);

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(ICazatalentos.InvalidParameter.selector, "amount"));
        cazatalentos.openPool{value: 0}(artistId, bytes32(0), _deadline(7 days));
    }

    function test_OpenPool_RevertsWithoutSupporters() public {
        uint256 artistId = _createArtist(owner, URI);

        vm.deal(owner, 1 ether);
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(ICazatalentos.NoSupportersYet.selector, artistId));
        cazatalentos.openPool{value: 1 ether}(artistId, bytes32(0), _deadline(7 days));
    }

    function test_OpenPool_RevertsOnDeadlineInPast() public {
        uint256 artistId = _createArtist(owner, URI);
        _signAs(alice, artistId);

        uint64 past = uint64(block.timestamp);
        vm.deal(owner, 1 ether);
        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(
                ICazatalentos.InvalidDeadline.selector,
                past,
                uint64(block.timestamp) + MAX_POOL_DURATION
            )
        );
        cazatalentos.openPool{value: 1 ether}(artistId, bytes32(0), past);
    }

    function test_OpenPool_RevertsOnDeadlineTooFar() public {
        uint256 artistId = _createArtist(owner, URI);
        _signAs(alice, artistId);

        uint64 maxDeadline = uint64(block.timestamp) + MAX_POOL_DURATION;
        uint64 tooFar = maxDeadline + 1;
        vm.deal(owner, 1 ether);
        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(ICazatalentos.InvalidDeadline.selector, tooFar, maxDeadline)
        );
        cazatalentos.openPool{value: 1 ether}(artistId, bytes32(0), tooFar);
    }

    function test_OpenPool_SnapshotIsFrozen() public {
        uint256 artistId = _createArtist(owner, URI);
        address[] memory supporters = _signMany(artistId, 15);
        uint256 poolId = _openPool(owner, artistId, 1 ether, _deadline(7 days));

        address sixteenth = _supporter(15);
        _signAs(sixteenth, artistId);

        ICazatalentos.Pool memory p = cazatalentos.poolOf(poolId);
        assertEq(p.supportersAtOpen, 15);
        assertEq(p.totalWeightAtOpen, 10 * 5 + 5 * 3);
        assertEq(p.totalWeightAtOpen, 65);

        vm.prank(owner);
        cazatalentos.claimMilestone(poolId, "ipfs://evidence");

        vm.prank(sixteenth);
        vm.expectRevert(
            abi.encodeWithSelector(ICazatalentos.NotEligible.selector, poolId, sixteenth)
        );
        cazatalentos.vote(poolId, true);

        vm.prank(supporters[0]);
        cazatalentos.vote(poolId, true);
        assertTrue(cazatalentos.hasVoted(poolId, supporters[0]));
    }

    // --- claimMilestone ---

    function test_ClaimMilestone_HappyPath() public {
        uint256 artistId = _createArtist(owner, URI);
        _signAs(alice, artistId);
        uint256 poolId = _openPool(owner, artistId, 1 ether, _deadline(7 days));

        vm.prank(owner);
        cazatalentos.claimMilestone(poolId, "ipfs://evidence");

        ICazatalentos.Pool memory p = cazatalentos.poolOf(poolId);
        assertEq(uint256(p.status), uint256(ICazatalentos.PoolStatus.Claimed));
        assertEq(p.voteEnd, uint64(block.timestamp) + VOTE_WINDOW);
        assertEq(p.evidenceURI, "ipfs://evidence");
    }

    function test_ClaimMilestone_RevertsOnNonArtist() public {
        uint256 artistId = _createArtist(owner, URI);
        _signAs(alice, artistId);
        uint256 poolId = _openPool(owner, artistId, 1 ether, _deadline(7 days));

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(ICazatalentos.NotArtistOwner.selector, artistId, alice)
        );
        cazatalentos.claimMilestone(poolId, "ipfs://evidence");
    }

    function test_ClaimMilestone_RevertsOnWrongStatus() public {
        uint256 artistId = _createArtist(owner, URI);
        _signAs(alice, artistId);
        uint256 poolId = _openPool(owner, artistId, 1 ether, _deadline(7 days));

        vm.prank(owner);
        cazatalentos.claimMilestone(poolId, "ipfs://evidence");

        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(
                ICazatalentos.PoolNotOpen.selector, poolId, ICazatalentos.PoolStatus.Claimed
            )
        );
        cazatalentos.claimMilestone(poolId, "ipfs://evidence-2");
    }

    function test_ClaimMilestone_RevertsAfterDeadline() public {
        uint256 artistId = _createArtist(owner, URI);
        _signAs(alice, artistId);
        uint64 deadline = _deadline(7 days);
        uint256 poolId = _openPool(owner, artistId, 1 ether, deadline);

        vm.warp(uint256(deadline) + 1);
        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(ICazatalentos.DeadlinePassed.selector, poolId, deadline)
        );
        cazatalentos.claimMilestone(poolId, "ipfs://evidence");
    }

    // --- vote ---

    function test_Vote_Approve() public {
        uint256 artistId = _createArtist(owner, URI);
        _signAs(alice, artistId);
        uint256 poolId = _openPool(owner, artistId, 1 ether, _deadline(7 days));
        vm.prank(owner);
        cazatalentos.claimMilestone(poolId, "ipfs://evidence");

        vm.prank(alice);
        cazatalentos.vote(poolId, true);

        ICazatalentos.Pool memory p = cazatalentos.poolOf(poolId);
        assertEq(p.votesFor, 5);
        assertEq(p.votesAgainst, 0);
        assertTrue(cazatalentos.hasVoted(poolId, alice));
    }

    function test_Vote_Reject() public {
        uint256 artistId = _createArtist(owner, URI);
        _signAs(alice, artistId);
        uint256 poolId = _openPool(owner, artistId, 1 ether, _deadline(7 days));
        vm.prank(owner);
        cazatalentos.claimMilestone(poolId, "ipfs://evidence");

        vm.prank(alice);
        cazatalentos.vote(poolId, false);

        assertEq(cazatalentos.poolOf(poolId).votesAgainst, 5);
    }

    function test_Vote_RevertsOnNonSupporter() public {
        uint256 artistId = _createArtist(owner, URI);
        _signAs(alice, artistId);
        uint256 poolId = _openPool(owner, artistId, 1 ether, _deadline(7 days));
        vm.prank(owner);
        cazatalentos.claimMilestone(poolId, "ipfs://evidence");

        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(ICazatalentos.NotEligible.selector, poolId, bob));
        cazatalentos.vote(poolId, true);
    }

    function test_Vote_RevertsOnRankAboveSnapshot() public {
        uint256 artistId = _createArtist(owner, URI);
        _signAs(alice, artistId);
        uint256 poolId = _openPool(owner, artistId, 1 ether, _deadline(7 days));
        _signAs(bob, artistId);

        vm.prank(owner);
        cazatalentos.claimMilestone(poolId, "ipfs://evidence");

        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(ICazatalentos.NotEligible.selector, poolId, bob));
        cazatalentos.vote(poolId, true);
    }

    function test_Vote_RevertsOnDoubleVote() public {
        uint256 artistId = _createArtist(owner, URI);
        _signAs(alice, artistId);
        uint256 poolId = _openPool(owner, artistId, 1 ether, _deadline(7 days));
        vm.prank(owner);
        cazatalentos.claimMilestone(poolId, "ipfs://evidence");

        vm.prank(alice);
        cazatalentos.vote(poolId, true);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(ICazatalentos.AlreadyVoted.selector, poolId, alice));
        cazatalentos.vote(poolId, false);
    }

    function test_Vote_RevertsBeforeClaimMilestone() public {
        uint256 artistId = _createArtist(owner, URI);
        _signAs(alice, artistId);
        uint256 poolId = _openPool(owner, artistId, 1 ether, _deadline(7 days));

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                ICazatalentos.PoolNotClaimed.selector, poolId, ICazatalentos.PoolStatus.Open
            )
        );
        cazatalentos.vote(poolId, true);
    }

    function test_Vote_RevertsAfterVoteWindow() public {
        uint256 artistId = _createArtist(owner, URI);
        _signAs(alice, artistId);
        uint256 poolId = _openPool(owner, artistId, 1 ether, _deadline(7 days));
        vm.prank(owner);
        cazatalentos.claimMilestone(poolId, "ipfs://evidence");
        uint64 voteEnd = cazatalentos.poolOf(poolId).voteEnd;

        vm.warp(voteEnd);
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(ICazatalentos.VotingClosed.selector, poolId, voteEnd)
        );
        cazatalentos.vote(poolId, true);
    }

    // --- finalize ---

    function test_Finalize_ApprovesWithQuorumAndMajority() public {
        uint256 artistId = _createArtist(owner, URI);
        address[] memory supporters = _signMany(artistId, 10);
        uint256 poolId = _openPool(owner, artistId, 1 ether, _deadline(7 days));
        vm.prank(owner);
        cazatalentos.claimMilestone(poolId, "ipfs://evidence");

        for (uint256 i = 0; i < 6; ++i) {
            vm.prank(supporters[i]);
            cazatalentos.vote(poolId, true);
        }

        uint64 voteEnd = cazatalentos.poolOf(poolId).voteEnd;
        vm.warp(voteEnd);
        cazatalentos.finalize(poolId);

        assertEq(
            uint256(cazatalentos.poolOf(poolId).status), uint256(ICazatalentos.PoolStatus.Approved)
        );
    }

    function test_Finalize_RejectsWithoutQuorum() public {
        uint256 artistId = _createArtist(owner, URI);
        address[] memory supporters = _signMany(artistId, 10);
        uint256 poolId = _openPool(owner, artistId, 1 ether, _deadline(7 days));
        vm.prank(owner);
        cazatalentos.claimMilestone(poolId, "ipfs://evidence");

        vm.prank(supporters[0]);
        cazatalentos.vote(poolId, true);

        vm.warp(cazatalentos.poolOf(poolId).voteEnd);
        cazatalentos.finalize(poolId);

        assertEq(
            uint256(cazatalentos.poolOf(poolId).status), uint256(ICazatalentos.PoolStatus.Rejected)
        );
    }

    function test_Finalize_RejectsOnBelowApprovalStrictness() public {
        uint256 artistId = _createArtist(owner, URI);
        address[] memory supporters = _signMany(artistId, 2);
        uint256 poolId = _openPool(owner, artistId, 1 ether, _deadline(7 days));
        vm.prank(owner);
        cazatalentos.claimMilestone(poolId, "ipfs://evidence");

        vm.prank(supporters[0]);
        cazatalentos.vote(poolId, true);
        vm.prank(supporters[1]);
        cazatalentos.vote(poolId, false);

        vm.warp(cazatalentos.poolOf(poolId).voteEnd);
        cazatalentos.finalize(poolId);

        ICazatalentos.Pool memory p = cazatalentos.poolOf(poolId);
        assertEq(p.votesFor, 5);
        assertEq(p.votesAgainst, 5);
        assertEq(uint256(p.status), uint256(ICazatalentos.PoolStatus.Rejected));
    }

    function test_Finalize_RevertsBeforeVoteEnd() public {
        uint256 artistId = _createArtist(owner, URI);
        _signAs(alice, artistId);
        uint256 poolId = _openPool(owner, artistId, 1 ether, _deadline(7 days));
        vm.prank(owner);
        cazatalentos.claimMilestone(poolId, "ipfs://evidence");
        uint64 voteEnd = cazatalentos.poolOf(poolId).voteEnd;

        vm.expectRevert(
            abi.encodeWithSelector(ICazatalentos.VotingStillOpen.selector, poolId, voteEnd)
        );
        cazatalentos.finalize(poolId);
    }

    function test_Finalize_RevertsOnWrongStatus() public {
        uint256 artistId = _createArtist(owner, URI);
        _signAs(alice, artistId);
        uint256 poolId = _openPool(owner, artistId, 1 ether, _deadline(7 days));

        vm.expectRevert(
            abi.encodeWithSelector(
                ICazatalentos.PoolNotClaimed.selector, poolId, ICazatalentos.PoolStatus.Open
            )
        );
        cazatalentos.finalize(poolId);
    }

    function test_Finalize_RevertsOnDoubleFinalize() public {
        uint256 artistId = _createArtist(owner, URI);
        address[] memory supporters = _signMany(artistId, 10);
        uint256 poolId = _openPool(owner, artistId, 1 ether, _deadline(7 days));
        vm.prank(owner);
        cazatalentos.claimMilestone(poolId, "ipfs://evidence");
        for (uint256 i = 0; i < 6; ++i) {
            vm.prank(supporters[i]);
            cazatalentos.vote(poolId, true);
        }
        vm.warp(cazatalentos.poolOf(poolId).voteEnd);
        cazatalentos.finalize(poolId);

        vm.expectRevert(
            abi.encodeWithSelector(
                ICazatalentos.PoolNotClaimed.selector, poolId, ICazatalentos.PoolStatus.Approved
            )
        );
        cazatalentos.finalize(poolId);
    }

    function test_Finalize_DecrementsActivePools() public {
        uint256 artistId = _createArtist(owner, URI);
        address[] memory supporters = _signMany(artistId, 10);
        uint256 poolId = _openPool(owner, artistId, 1 ether, _deadline(7 days));
        assertEq(cazatalentos.activePoolsByArtist(artistId), 1);

        vm.prank(owner);
        cazatalentos.claimMilestone(poolId, "ipfs://evidence");
        for (uint256 i = 0; i < 6; ++i) {
            vm.prank(supporters[i]);
            cazatalentos.vote(poolId, true);
        }
        vm.warp(cazatalentos.poolOf(poolId).voteEnd);
        cazatalentos.finalize(poolId);

        assertEq(cazatalentos.activePoolsByArtist(artistId), 0);
    }

    // --- claimReward ---

    function test_ClaimReward_HappyPath() public {
        uint256 artistId = _createArtist(owner, URI);
        address[] memory supporters = _signMany(artistId, 3);
        uint256 poolId = _openPool(owner, artistId, 0.3 ether, _deadline(7 days));
        vm.prank(owner);
        cazatalentos.claimMilestone(poolId, "ipfs://evidence");
        for (uint256 i = 0; i < 3; ++i) {
            vm.prank(supporters[i]);
            cazatalentos.vote(poolId, true);
        }
        vm.warp(cazatalentos.poolOf(poolId).voteEnd);
        cazatalentos.finalize(poolId);

        uint256 before0 = supporters[0].balance;
        vm.prank(supporters[0]);
        cazatalentos.claimReward(poolId);
        assertEq(supporters[0].balance - before0, 0.1 ether);

        uint256 before1 = supporters[1].balance;
        vm.prank(supporters[1]);
        cazatalentos.claimReward(poolId);
        assertEq(supporters[1].balance - before1, 0.1 ether);

        uint256 before2 = supporters[2].balance;
        vm.prank(supporters[2]);
        cazatalentos.claimReward(poolId);
        assertEq(supporters[2].balance - before2, 0.1 ether);
    }

    function test_ClaimReward_DustStaysInContract() public {
        uint256 artistId = _createArtist(owner, URI);
        address[] memory supporters = _signMany(artistId, 3);
        uint256 poolAmount = 1 ether;
        uint256 poolId = _openPool(owner, artistId, poolAmount, _deadline(7 days));
        vm.prank(owner);
        cazatalentos.claimMilestone(poolId, "ipfs://evidence");
        for (uint256 i = 0; i < 3; ++i) {
            vm.prank(supporters[i]);
            cazatalentos.vote(poolId, true);
        }
        vm.warp(cazatalentos.poolOf(poolId).voteEnd);
        cazatalentos.finalize(poolId);

        uint256 claimed;
        for (uint256 i = 0; i < 3; ++i) {
            uint256 before = supporters[i].balance;
            vm.prank(supporters[i]);
            cazatalentos.claimReward(poolId);
            claimed += supporters[i].balance - before;
        }

        assertLt(poolAmount - claimed, 3);
        assertGt(poolAmount - claimed, 0);
    }

    function test_ClaimReward_RevertsOnRejected() public {
        uint256 artistId = _createArtist(owner, URI);
        address[] memory supporters = _signMany(artistId, 10);
        uint256 poolId = _openPool(owner, artistId, 1 ether, _deadline(7 days));
        vm.prank(owner);
        cazatalentos.claimMilestone(poolId, "ipfs://evidence");
        vm.prank(supporters[0]);
        cazatalentos.vote(poolId, true);
        vm.warp(cazatalentos.poolOf(poolId).voteEnd);
        cazatalentos.finalize(poolId);

        vm.prank(supporters[0]);
        vm.expectRevert(
            abi.encodeWithSelector(
                ICazatalentos.PoolNotApproved.selector, poolId, ICazatalentos.PoolStatus.Rejected
            )
        );
        cazatalentos.claimReward(poolId);
    }

    function test_ClaimReward_RevertsOnDoubleClaim() public {
        uint256 artistId = _createArtist(owner, URI);
        address[] memory supporters = _signMany(artistId, 3);
        uint256 poolId = _openPool(owner, artistId, 0.3 ether, _deadline(7 days));
        vm.prank(owner);
        cazatalentos.claimMilestone(poolId, "ipfs://evidence");
        for (uint256 i = 0; i < 3; ++i) {
            vm.prank(supporters[i]);
            cazatalentos.vote(poolId, true);
        }
        vm.warp(cazatalentos.poolOf(poolId).voteEnd);
        cazatalentos.finalize(poolId);

        vm.prank(supporters[0]);
        cazatalentos.claimReward(poolId);

        vm.prank(supporters[0]);
        vm.expectRevert(
            abi.encodeWithSelector(ICazatalentos.AlreadyClaimed.selector, poolId, supporters[0])
        );
        cazatalentos.claimReward(poolId);
    }

    function test_ClaimReward_RevertsOnIneligible() public {
        uint256 artistId = _createArtist(owner, URI);
        address[] memory supporters = _signMany(artistId, 3);
        uint256 poolId = _openPool(owner, artistId, 0.3 ether, _deadline(7 days));
        address late = _supporter(99);
        _signAs(late, artistId);

        vm.prank(owner);
        cazatalentos.claimMilestone(poolId, "ipfs://evidence");
        for (uint256 i = 0; i < 3; ++i) {
            vm.prank(supporters[i]);
            cazatalentos.vote(poolId, true);
        }
        vm.warp(cazatalentos.poolOf(poolId).voteEnd);
        cazatalentos.finalize(poolId);

        vm.prank(late);
        vm.expectRevert(abi.encodeWithSelector(ICazatalentos.NotEligible.selector, poolId, late));
        cazatalentos.claimReward(poolId);
    }

    // --- reclaimPool ---

    function test_ReclaimPool_FromRejected() public {
        uint256 artistId = _createArtist(owner, URI);
        address[] memory supporters = _signMany(artistId, 10);
        uint256 poolId = _openPool(owner, artistId, 1 ether, _deadline(7 days));
        vm.prank(owner);
        cazatalentos.claimMilestone(poolId, "ipfs://evidence");
        vm.prank(supporters[0]);
        cazatalentos.vote(poolId, true);
        vm.warp(cazatalentos.poolOf(poolId).voteEnd);
        cazatalentos.finalize(poolId);

        uint256 before = owner.balance;
        vm.prank(owner);
        cazatalentos.reclaimPool(poolId);
        assertEq(owner.balance - before, 1 ether);
        assertEq(
            uint256(cazatalentos.poolOf(poolId).status), uint256(ICazatalentos.PoolStatus.Reclaimed)
        );
        assertEq(cazatalentos.poolOf(poolId).amount, 0);
    }

    function test_ReclaimPool_FromExpiredOpen() public {
        uint256 artistId = _createArtist(owner, URI);
        _signAs(alice, artistId);
        uint64 deadline = _deadline(7 days);
        uint256 poolId = _openPool(owner, artistId, 1 ether, deadline);

        vm.warp(uint256(deadline) + 1);
        uint256 before = owner.balance;
        vm.prank(owner);
        cazatalentos.reclaimPool(poolId);
        assertEq(owner.balance - before, 1 ether);
        assertEq(cazatalentos.activePoolsByArtist(artistId), 0);
    }

    function test_ReclaimPool_RevertsOnNonArtist() public {
        uint256 artistId = _createArtist(owner, URI);
        address[] memory supporters = _signMany(artistId, 10);
        uint256 poolId = _openPool(owner, artistId, 1 ether, _deadline(7 days));
        vm.prank(owner);
        cazatalentos.claimMilestone(poolId, "ipfs://evidence");
        vm.prank(supporters[0]);
        cazatalentos.vote(poolId, true);
        vm.warp(cazatalentos.poolOf(poolId).voteEnd);
        cazatalentos.finalize(poolId);

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(ICazatalentos.NotArtistOwner.selector, artistId, alice)
        );
        cazatalentos.reclaimPool(poolId);
    }

    function test_ReclaimPool_RevertsWhileOpenAndNotExpired() public {
        uint256 artistId = _createArtist(owner, URI);
        _signAs(alice, artistId);
        uint256 poolId = _openPool(owner, artistId, 1 ether, _deadline(7 days));

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(ICazatalentos.InvalidParameter.selector, "status"));
        cazatalentos.reclaimPool(poolId);
    }

    function test_ReclaimPool_RevertsOnApproved() public {
        uint256 artistId = _createArtist(owner, URI);
        address[] memory supporters = _signMany(artistId, 10);
        uint256 poolId = _openPool(owner, artistId, 1 ether, _deadline(7 days));
        vm.prank(owner);
        cazatalentos.claimMilestone(poolId, "ipfs://evidence");
        for (uint256 i = 0; i < 6; ++i) {
            vm.prank(supporters[i]);
            cazatalentos.vote(poolId, true);
        }
        vm.warp(cazatalentos.poolOf(poolId).voteEnd);
        cazatalentos.finalize(poolId);

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(ICazatalentos.InvalidParameter.selector, "status"));
        cazatalentos.reclaimPool(poolId);
    }

    function test_ReclaimPool_RevertsOnDoubleReclaim() public {
        uint256 artistId = _createArtist(owner, URI);
        _signAs(alice, artistId);
        uint64 deadline = _deadline(7 days);
        uint256 poolId = _openPool(owner, artistId, 1 ether, deadline);
        vm.warp(uint256(deadline) + 1);

        vm.prank(owner);
        cazatalentos.reclaimPool(poolId);

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(ICazatalentos.InvalidParameter.selector, "status"));
        cazatalentos.reclaimPool(poolId);
    }

    function test_ReclaimPool_DecrementsActivePoolsOnExpiredOpen() public {
        uint256 artistId = _createArtist(owner, URI);
        _signAs(alice, artistId);
        uint64 deadline = _deadline(7 days);
        uint256 poolId = _openPool(owner, artistId, 1 ether, deadline);
        assertEq(cazatalentos.activePoolsByArtist(artistId), 1);

        vm.warp(uint256(deadline) + 1);
        vm.prank(owner);
        cazatalentos.reclaimPool(poolId);
        assertEq(cazatalentos.activePoolsByArtist(artistId), 0);
    }

    // --- withdrawStake ---

    function test_WithdrawStake_HappyPath() public {
        uint256 artistId = _createArtist(owner, URI);
        _signAs(alice, artistId);

        uint256 before = alice.balance;
        vm.prank(alice);
        cazatalentos.withdrawStake(artistId);
        assertEq(alice.balance - before, MIN_STAKE);
        assertEq(cazatalentos.supporterOf(artistId, alice).stake, 0);
        assertEq(cazatalentos.stakedByArtist(artistId), 0);
    }

    function test_WithdrawStake_BlockedByOpenPool() public {
        uint256 artistId = _createArtist(owner, URI);
        _signAs(alice, artistId);
        _openPool(owner, artistId, 1 ether, _deadline(7 days));

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(ICazatalentos.HasActivePools.selector, artistId, 1));
        cazatalentos.withdrawStake(artistId);
    }

    function test_WithdrawStake_BlockedByClaimedPool() public {
        uint256 artistId = _createArtist(owner, URI);
        _signAs(alice, artistId);
        uint256 poolId = _openPool(owner, artistId, 1 ether, _deadline(7 days));
        vm.prank(owner);
        cazatalentos.claimMilestone(poolId, "ipfs://evidence");

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(ICazatalentos.HasActivePools.selector, artistId, 1));
        cazatalentos.withdrawStake(artistId);
    }

    function test_WithdrawStake_AllowedAfterRejected() public {
        uint256 artistId = _createArtist(owner, URI);
        address[] memory supporters = _signMany(artistId, 10);
        uint256 poolId = _openPool(owner, artistId, 1 ether, _deadline(7 days));
        vm.prank(owner);
        cazatalentos.claimMilestone(poolId, "ipfs://evidence");
        vm.prank(supporters[0]);
        cazatalentos.vote(poolId, true);
        vm.warp(cazatalentos.poolOf(poolId).voteEnd);
        cazatalentos.finalize(poolId);

        uint256 before = supporters[0].balance;
        vm.prank(supporters[0]);
        cazatalentos.withdrawStake(artistId);
        assertEq(supporters[0].balance - before, MIN_STAKE);
    }

    function test_WithdrawStake_AllowedAfterReclaimed() public {
        uint256 artistId = _createArtist(owner, URI);
        _signAs(alice, artistId);
        uint64 deadline = _deadline(7 days);
        uint256 poolId = _openPool(owner, artistId, 1 ether, deadline);
        vm.warp(uint256(deadline) + 1);
        vm.prank(owner);
        cazatalentos.reclaimPool(poolId);

        vm.prank(alice);
        cazatalentos.withdrawStake(artistId);
        assertEq(cazatalentos.supporterOf(artistId, alice).stake, 0);
    }

    function test_WithdrawStake_RevertsOnDoubleWithdraw() public {
        uint256 artistId = _createArtist(owner, URI);
        _signAs(alice, artistId);
        vm.prank(alice);
        cazatalentos.withdrawStake(artistId);

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(ICazatalentos.NothingToWithdraw.selector, artistId, alice)
        );
        cazatalentos.withdrawStake(artistId);
    }

    function test_WithdrawStake_RankPersists() public {
        uint256 artistId = _createArtist(owner, URI);
        _signAs(alice, artistId);
        vm.prank(alice);
        cazatalentos.withdrawStake(artistId);

        ICazatalentos.Supporter memory s = cazatalentos.supporterOf(artistId, alice);
        assertEq(s.rank, 1);
        assertEq(s.weight, 5);
        assertEq(s.stake, 0);
    }

    // --- Phase 2 fuzz ---

    function testFuzz_WeightSumUpTo_MatchesLoop(uint32 n) public view {
        n = uint32(bound(n, 0, 1000));
        uint256 expected;
        for (uint32 i = 1; i <= n; ++i) {
            expected += _expectedWeight(i);
        }
        assertEq(cazatalentos.weightSumUpTo(n), expected);
    }

    function testFuzz_OpenPool_AmountMatchesMsgValue(uint96 amount) public {
        amount = uint96(bound(amount, 1, 100 ether));
        uint256 artistId = _createArtist(owner, URI);
        _signAs(alice, artistId);
        uint256 poolId = _openPool(owner, artistId, amount, _deadline(7 days));
        assertEq(cazatalentos.poolOf(poolId).amount, amount);
    }

    function testFuzz_ClaimReward_SumNeverExceedsPool(uint8 n, uint96 amount) public {
        n = uint8(bound(n, 1, 30));
        amount = uint96(bound(amount, 0.001 ether, 10 ether));

        uint256 artistId = _createArtist(owner, URI);
        address[] memory supporters = _signMany(artistId, n);
        uint256 poolId = _openPool(owner, artistId, amount, _deadline(7 days));
        vm.prank(owner);
        cazatalentos.claimMilestone(poolId, "ipfs://evidence");
        for (uint256 i = 0; i < n; ++i) {
            vm.prank(supporters[i]);
            cazatalentos.vote(poolId, true);
        }
        vm.warp(cazatalentos.poolOf(poolId).voteEnd);
        cazatalentos.finalize(poolId);

        uint256 claimed;
        for (uint256 i = 0; i < n; ++i) {
            uint256 before = supporters[i].balance;
            vm.prank(supporters[i]);
            cazatalentos.claimReward(poolId);
            claimed += supporters[i].balance - before;
        }
        assertLe(claimed, amount);
    }

    function testFuzz_Finalize_ApprovalIsStrict(uint8 yes, uint8 no) public {
        yes = uint8(bound(yes, 1, 20));
        no = uint8(bound(no, 1, 20));
        uint256 total = uint256(yes) + uint256(no);

        uint256 artistId = _createArtist(owner, URI);
        address[] memory supporters = _signMany(artistId, total);
        uint256 poolId = _openPool(owner, artistId, 1 ether, _deadline(7 days));
        vm.prank(owner);
        cazatalentos.claimMilestone(poolId, "ipfs://evidence");

        uint256 votesFor;
        uint256 votesAgainst;
        for (uint256 i = 0; i < yes; ++i) {
            vm.prank(supporters[i]);
            cazatalentos.vote(poolId, true);
            votesFor += cazatalentos.supporterOf(artistId, supporters[i]).weight;
        }
        for (uint256 i = 0; i < no; ++i) {
            vm.prank(supporters[yes + i]);
            cazatalentos.vote(poolId, false);
            votesAgainst += cazatalentos.supporterOf(artistId, supporters[yes + i]).weight;
        }

        vm.warp(cazatalentos.poolOf(poolId).voteEnd);
        cazatalentos.finalize(poolId);

        uint256 totalVotes = votesFor + votesAgainst;
        uint256 totalWeight = cazatalentos.poolOf(poolId).totalWeightAtOpen;
        bool quorumMet = totalVotes >= (totalWeight * QUORUM_BPS) / 10_000;
        bool majorityMet = totalVotes > 0 && (votesFor * 10_000) > (totalVotes * APPROVAL_BPS);
        ICazatalentos.PoolStatus expected = (quorumMet && majorityMet)
            ? ICazatalentos.PoolStatus.Approved
            : ICazatalentos.PoolStatus.Rejected;

        assertEq(uint256(cazatalentos.poolOf(poolId).status), uint256(expected));
        assertEq(cazatalentos.poolOf(poolId).votesFor, votesFor);
        assertEq(cazatalentos.poolOf(poolId).votesAgainst, votesAgainst);
    }

    function testFuzz_Vote_WeightMatchesRank(uint32 rank, bool approve) public {
        rank = uint32(bound(rank, 1, 1000));

        uint256 artistId = _createArtist(owner, URI);
        address[] memory supporters = _signMany(artistId, rank);
        address voter = supporters[rank - 1];
        uint256 poolId = _openPool(owner, artistId, 1 ether, _deadline(7 days));
        vm.prank(owner);
        cazatalentos.claimMilestone(poolId, "ipfs://evidence");

        uint8 weight = cazatalentos.weightForRank(rank);
        vm.prank(voter);
        cazatalentos.vote(poolId, approve);

        ICazatalentos.Pool memory p = cazatalentos.poolOf(poolId);
        if (approve) {
            assertEq(p.votesFor, weight);
            assertEq(p.votesAgainst, 0);
        } else {
            assertEq(p.votesAgainst, weight);
            assertEq(p.votesFor, 0);
        }
    }

    // --- Phase 2 coverage ---

    function test_WeightSumUpTo_Boundaries() public view {
        assertEq(cazatalentos.weightSumUpTo(0), 0);
        assertEq(cazatalentos.weightSumUpTo(1), 5);
        assertEq(cazatalentos.weightSumUpTo(9), 45);
        assertEq(cazatalentos.weightSumUpTo(10), 50);
        assertEq(cazatalentos.weightSumUpTo(11), 53);
        assertEq(cazatalentos.weightSumUpTo(49), 167);
        assertEq(cazatalentos.weightSumUpTo(50), 170);
        assertEq(cazatalentos.weightSumUpTo(51), 172);
        assertEq(cazatalentos.weightSumUpTo(199), 468);
        assertEq(cazatalentos.weightSumUpTo(200), 470);
        assertEq(cazatalentos.weightSumUpTo(201), 471);
        assertEq(cazatalentos.weightSumUpTo(250), 520);
        assertEq(cazatalentos.weightSumUpTo(1000), 1270);
    }

    function test_Finalize_RejectsWithZeroVotes() public {
        uint256 artistId = _createArtist(owner, URI);
        _signMany(artistId, 3);
        uint256 poolId = _openPool(owner, artistId, 1 ether, _deadline(7 days));
        vm.prank(owner);
        cazatalentos.claimMilestone(poolId, "ipfs://evidence");

        vm.warp(cazatalentos.poolOf(poolId).voteEnd);
        cazatalentos.finalize(poolId);

        assertEq(
            uint256(cazatalentos.poolOf(poolId).status), uint256(ICazatalentos.PoolStatus.Rejected)
        );
        assertEq(cazatalentos.poolOf(poolId).votesFor, 0);
        assertEq(cazatalentos.poolOf(poolId).votesAgainst, 0);
    }

    function test_ReclaimPool_RevertsOnClaimedStatus() public {
        uint256 artistId = _createArtist(owner, URI);
        _signAs(alice, artistId);
        uint256 poolId = _openPool(owner, artistId, 1 ether, _deadline(7 days));
        vm.prank(owner);
        cazatalentos.claimMilestone(poolId, "ipfs://evidence");

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(ICazatalentos.InvalidParameter.selector, "status"));
        cazatalentos.reclaimPool(poolId);
    }

    function test_PoolOf_RevertsOnNonExistentPool() public {
        vm.expectRevert(abi.encodeWithSelector(ICazatalentos.PoolDoesNotExist.selector, 999));
        cazatalentos.poolOf(999);
    }

    function test_ClaimMilestone_RevertsOnNonExistentPool() public {
        vm.expectRevert(abi.encodeWithSelector(ICazatalentos.PoolDoesNotExist.selector, 999));
        cazatalentos.claimMilestone(999, "x");
    }

    function test_Vote_RevertsOnNonExistentPool() public {
        vm.expectRevert(abi.encodeWithSelector(ICazatalentos.PoolDoesNotExist.selector, 999));
        cazatalentos.vote(999, true);
    }

    function test_Finalize_RevertsOnNonExistentPool() public {
        vm.expectRevert(abi.encodeWithSelector(ICazatalentos.PoolDoesNotExist.selector, 999));
        cazatalentos.finalize(999);
    }

    function test_ClaimReward_RevertsOnNonExistentPool() public {
        vm.expectRevert(abi.encodeWithSelector(ICazatalentos.PoolDoesNotExist.selector, 999));
        cazatalentos.claimReward(999);
    }

    function test_ReclaimPool_RevertsOnNonExistentPool() public {
        vm.expectRevert(abi.encodeWithSelector(ICazatalentos.PoolDoesNotExist.selector, 999));
        cazatalentos.reclaimPool(999);
    }

    function test_WithdrawStake_RevertsWithoutArtist() public {
        vm.expectRevert(abi.encodeWithSelector(ICazatalentos.ArtistDoesNotExist.selector, 999));
        cazatalentos.withdrawStake(999);
    }

    function test_HasVoted_DefaultFalse() public view {
        assertFalse(cazatalentos.hasVoted(1, address(0xBEEF)));
    }

    function test_HasClaimed_DefaultFalse() public view {
        assertFalse(cazatalentos.hasClaimed(1, address(0xCAFE)));
    }

    function test_ActivePoolsByArtist_DefaultZero() public view {
        assertEq(cazatalentos.activePoolsByArtist(999), 0);
    }

    function test_TotalPools_StartsAtZero() public {
        Cazatalentos fresh = _deploy();
        assertEq(fresh.totalPools(), 0);
    }

    function test_OpenPool_RevertsOnUnknownArtist() public {
        vm.deal(owner, 1 ether);
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(ICazatalentos.ArtistDoesNotExist.selector, 999));
        cazatalentos.openPool{value: 1 ether}(999, bytes32(0), _deadline(7 days));
    }

    function test_ClaimReward_RevertsOnTransferFailed() public {
        RejectEther rejector = new RejectEther();
        vm.deal(address(rejector), 1 ether);

        uint256 artistId = _createArtist(owner, URI);
        rejector.sign{value: MIN_STAKE}(cazatalentos, artistId);
        _signAs(alice, artistId);
        _signAs(bob, artistId);

        uint256 poolId = _openPool(owner, artistId, 0.3 ether, _deadline(7 days));
        vm.prank(owner);
        cazatalentos.claimMilestone(poolId, "ipfs://evidence");

        rejector.vote(cazatalentos, poolId, true);
        vm.prank(alice);
        cazatalentos.vote(poolId, true);
        vm.prank(bob);
        cazatalentos.vote(poolId, true);

        vm.warp(cazatalentos.poolOf(poolId).voteEnd);
        cazatalentos.finalize(poolId);

        uint256 reward = (0.3 ether * 5) / 15;
        vm.expectRevert(
            abi.encodeWithSelector(ICazatalentos.TransferFailed.selector, address(rejector), reward)
        );
        rejector.claimReward(cazatalentos, poolId);
    }

    function test_ReclaimPool_RevertsOnTransferFailed() public {
        RejectEther rejector = new RejectEther();
        vm.deal(address(rejector), 2 ether);

        uint256 artistId = rejector.register(cazatalentos, "ipfs://rejector");
        _signAs(alice, artistId);

        uint64 deadline = _deadline(7 days);
        uint256 poolId =
            rejector.open{value: 1 ether}(cazatalentos, artistId, keccak256("milestone"), deadline);

        vm.warp(uint256(deadline) + 1);
        vm.expectRevert(
            abi.encodeWithSelector(
                ICazatalentos.TransferFailed.selector, address(rejector), 1 ether
            )
        );
        rejector.reclaim(cazatalentos, poolId);
    }

    function test_WithdrawStake_RevertsOnTransferFailed() public {
        RejectEther rejector = new RejectEther();
        vm.deal(address(rejector), 1 ether);

        uint256 artistId = _createArtist(owner, URI);
        rejector.sign{value: MIN_STAKE}(cazatalentos, artistId);

        vm.expectRevert(
            abi.encodeWithSelector(
                ICazatalentos.TransferFailed.selector, address(rejector), MIN_STAKE
            )
        );
        rejector.withdraw(cazatalentos, artistId);
    }
}
